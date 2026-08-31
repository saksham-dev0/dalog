import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import { internalAction } from "./_generated/server"
import { CHANNELS, type Channel } from "./content"

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models"
/** Overridable per deployment; Flash is fast enough for a five-piece run. */
const DEFAULT_MODEL = "gemini-3.7-flash"
/** Diff text is the expensive part of the prompt — keep it bounded. */
const MAX_DIGEST_CHARS = 40_000
const MAX_PATCH_CHARS_PER_FILE = 3_000
/** The codebase profile is stored apart from the diff so neither crowds the other. */
const MAX_PROFILE_CHARS = 14_000

type GeminiPart = { text?: string }
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>
    }
  }>
}

function model(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_MODEL
}

/**
 * One Gemini call. `search: true` turns on Google Search grounding (used for
 * the format research); `json: true` asks for a JSON object back. The two are
 * mutually exclusive in the API, which is why research and writing are
 * separate passes.
 */
async function callGemini(
  prompt: string,
  options: { search?: boolean; system?: string } = {}
): Promise<{ text: string; sources: string[] }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set on this deployment")

  const res = await fetch(
    `${GEMINI_API}/${model()}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(options.system
          ? { systemInstruction: { parts: [{ text: options.system }] } }
          : {}),
        ...(options.search ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: { temperature: options.search ? 0.3 : 0.8 },
      }),
    }
  )

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`)
  }

  const body = (await res.json()) as GeminiResponse
  const candidate = body.candidates?.[0]
  const text = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim()
  if (!text) throw new Error("Gemini returned an empty response")

  const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => chunk.web?.uri)
    .filter((uri): uri is string => typeof uri === "string")

  return { text, sources: [...new Set(sources)] }
}

/* -------------------------------------------------------------------------- */
/* Step 1 — read the actual code changes                                       */
/* -------------------------------------------------------------------------- */

type FileChange = {
  filename: string
  status: string
  additions: number
  deletions: number
  patch?: string
}

async function githubJson<T>(token: string, path: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
  if (!res.ok) return null

  return (await res.json()) as T
}

function renderFiles(files: FileChange[]): string {
  return files
    .slice(0, 25)
    .map((file) => {
      const header = `${file.status} ${file.filename} (+${file.additions}/-${file.deletions})`
      const patch = file.patch?.slice(0, MAX_PATCH_CHARS_PER_FILE) ?? ""

      return patch ? `${header}\n${patch}` : header
    })
    .join("\n\n")
}

/** Keeps the commit body, not just the subject line — that is where intent lives. */
function renderCommitMessage(message: string): string {
  const [subject, ...rest] = message.split("\n")
  const body = rest.join("\n").trim()

  return body ? `- ${subject}\n  ${body.replace(/\n/g, "\n  ")}` : `- ${subject}`
}

/**
 * Branch and commit names are the cheapest statement of intent in the whole
 * repo: `fix/webhook-retry`, `FEAT: context added on every scan`. They are
 * pulled out and labelled so the model reads them as the author's own summary
 * rather than as noise at the top of a diff.
 */
function namingSignals(
  subject: Doc<"repoEvents"> | null,
  repo: Doc<"watchedRepos">
): string {
  if (!subject) return ""

  const lines = [
    `Event type: ${subject.kind} / ${subject.action}`,
    `Title as the author wrote it: "${subject.title}"`,
    subject.branch ? `Branch name: ${subject.branch}` : "",
    subject.branch && subject.branch !== repo.defaultBranch
      ? `Branch name segments (often the intent in shorthand): ${subject.branch
          .split(/[\/_\-.]+/)
          .filter(Boolean)
          .join(" | ")}`
      : "",
    subject.number ? `Number: #${subject.number}` : "",
    `Author: ${subject.actor}`,
  ]

  return `NAMING SIGNALS (the author's own shorthand for this change — treat as stated intent, not speculation):\n${lines
    .filter(Boolean)
    .join("\n")}`
}

/**
 * Builds the "what actually changed" prompt input: the event list plus real
 * diffs for the merged PRs and the newest commits. Commit messages alone are
 * not enough to write anything accurate.
 */
export const buildSourceDigest = internalAction({
  args: { draftId: v.id("contentDrafts"), version: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sources: {
      repo: Doc<"watchedRepos">
      draft: Doc<"contentDrafts">
      subject: Doc<"repoEvents"> | null
      events: Doc<"repoEvents">[]
    } | null = await ctx.runQuery(internal.content.getDraftSources, {
      draftId: args.draftId,
    })
    if (!sources) return null

    const { repo, subject, events } = sources
    const token = await ctx.runAction(internal.github.getTokenForRepo, {
      repoId: repo._id,
    })
    // The whole-codebase read. Cached on the repo, so this is one call per
    // scan and usually a cache hit.
    const repoProfile: string = await ctx.runAction(
      internal.github.buildRepoProfile,
      { repoId: repo._id }
    )
    const name = repo.fullName
    const sections: string[] = [
      `Repository: ${name} (default branch ${repo.defaultBranch})`,
      namingSignals(subject, repo),
    ]

    // Each kind needs a different read to see what actually changed.
    if (subject?.kind === "commit" && subject.sha) {
      const detail = await githubJson<{
        commit?: { message?: string }
        stats?: { additions: number; deletions: number }
        files?: FileChange[]
      }>(token, `/repos/${name}/commits/${subject.sha}`)

      if (detail) {
        sections.push(
          `Commit message:\n${detail.commit?.message ?? subject.title}`,
          detail.stats
            ? `Stats: +${detail.stats.additions}/-${detail.stats.deletions}`
            : "",
          detail.files ? `Changed files:\n${renderFiles(detail.files)}` : ""
        )
      }
    } else if (
      (subject?.kind === "merge" || subject?.kind === "pull_request") &&
      subject.number
    ) {
      const pull = await githubJson<{
        title?: string
        body?: string | null
        additions?: number
        deletions?: number
        changed_files?: number
        base?: { ref?: string }
        head?: { ref?: string }
      }>(token, `/repos/${name}/pulls/${subject.number}`)
      const files = await githubJson<FileChange[]>(
        token,
        `/repos/${name}/pulls/${subject.number}/files?per_page=30`
      )
      const commits = await githubJson<
        Array<{ sha: string; commit: { message: string } }>
      >(token, `/repos/${name}/pulls/${subject.number}/commits?per_page=30`)

      sections.push(
        `Pull request #${subject.number}: ${pull?.title ?? subject.title}`,
        pull?.body ? `Description:\n${pull.body.slice(0, 4_000)}` : "",
        pull?.base?.ref
          ? `Merged ${pull.head?.ref ?? "?"} into ${pull.base.ref} (+${pull.additions ?? 0}/-${pull.deletions ?? 0} across ${pull.changed_files ?? 0} files)`
          : "",
        commits
          ? `Commits in this PR (full messages — the author often explains the change here):\n${commits
              .map((c) => renderCommitMessage(c.commit.message))
              .join("\n")}`
          : "",
        files ? `Changed files:\n${renderFiles(files)}` : ""
      )
    } else if (subject?.kind === "branch" && subject.branch) {
      // A branch is only interesting as its delta from the default branch.
      const compare = await githubJson<{
        ahead_by?: number
        behind_by?: number
        commits?: Array<{ sha: string; commit: { message: string } }>
        files?: FileChange[]
      }>(
        token,
        `/repos/${name}/compare/${encodeURIComponent(repo.defaultBranch)}...${encodeURIComponent(subject.branch)}`
      )

      if (compare) {
        sections.push(
          `Branch ${subject.branch} is ${compare.ahead_by ?? 0} commits ahead of ${repo.defaultBranch}`,
          compare.commits
            ? `Commits on the branch (full messages):\n${compare.commits
                .slice(0, 30)
                .map((c) => renderCommitMessage(c.commit.message))
                .join("\n")}`
            : "",
          compare.files ? `Changed files:\n${renderFiles(compare.files)}` : ""
        )
      }
    }

    if (events.length > 0) {
      sections.push(
        `Surrounding activity (context only, not the subject):\n${events
          .slice(0, 15)
          .map(
            (event) =>
              `- [${event.kind}/${event.action}] ${event.title}${
                event.number ? ` (#${event.number})` : ""
              }`
          )
          .join("\n")}`
      )
    }

    const digest = sections
      .filter(Boolean)
      .join("\n\n")
      .slice(0, MAX_DIGEST_CHARS)

    await ctx.runMutation(internal.content.saveSourceDigest, {
      draftId: args.draftId,
      version: args.version,
      sourceDigest: digest,
      repoProfile: repoProfile.slice(0, MAX_PROFILE_CHARS),
    })

    return null
  },
})

/* -------------------------------------------------------------------------- */
/* Step 2 — turn the raw diff into a grounded brief                            */
/* -------------------------------------------------------------------------- */

/**
 * Compresses the diff into the brief every writing pass reads. Doing this once,
 * with an explicit "unknowns" section, is what keeps the five posts from
 * inventing motivation or numbers the diff never showed.
 */
export const buildChangeBrief = internalAction({
  args: { draftId: v.id("contentDrafts"), version: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft: Doc<"contentDrafts"> | null = await ctx.runQuery(
      internal.content.getDraftInternal,
      { draftId: args.draftId }
    )
    if (!draft || draft.version !== args.version) return null

    const { text } = await callGemini(
      `Read this codebase and this change, then write the brief a build-in-public writer will turn into posts. You are mining for BOTH facts and story.

THE CODEBASE (what this project is, its stack, its layout, its README — use it to understand what the change means for the project as a whole):
${draft.repoProfile ?? "(no codebase profile available)"}

THE CHANGE (the only source of truth for what happened):
${draft.sourceDigest ?? "(no diff available)"}

Write these sections, plainly, no preamble:
WHAT CHANGED — the concrete change, in 2-4 sentences, naming the real modules/files/functions.
HOW IT WORKS — the mechanism, specific enough that a developer could argue with it.
WHY (STATED) — motivation actually stated by the author, in this priority order: the PR description, the commit message bodies, the branch name, the commit/PR title, code comments. Branch and commit names are the author's own summary — read them as intent ("fix/webhook-retry" means retries were broken), not as decoration. Quote the phrasing you took it from. Only if none of these say anything, write "not stated in the change".
WHERE IT FITS — where these files sit in the project per the codebase profile, what they connect to, and what the project does overall. One reader-friendly sentence a stranger could follow.
USER-FACING IMPACT — what someone using this would notice. If the diff does not show one, say so.
NUMBERS — any real figures present (file counts, line counts, timings, limits). Never estimate or invent one.
THE TENSION — what was broken, slow, ugly, or annoying BEFORE this change, as evidenced by the code being replaced. This is the story engine; be concrete about the old way.
SURPRISE — the least obvious thing here: a non-obvious tradeoff, a counterintuitive approach, a constraint that forced the design, a thing most devs get wrong. If nothing is surprising, say "nothing surprising".
OPINION MATERIAL — the arguable positions this change implies (a pattern chosen over a popular one, a library not used, a shortcut taken deliberately). Devs argue with opinions; list the real ones this code takes.
RELATABLE MOMENT — the part another builder would recognize from their own work (the yak-shave, the rewrite, the thing that took 4x longer than expected), grounded in what the diff shows.
UNKNOWNS — what a reader would want to know that this change does not answer. The writer must not guess at these.

Rules: every claim must be traceable to the codebase profile or the change above. TENSION, SURPRISE, OPINION MATERIAL and RELATABLE MOMENT must be read out of the actual code, not imagined — if the diff does not support one, write "not visible in this change" rather than inventing it. Do not speculate about performance or adoption. Do not use marketing language.`,
      {
        system:
          "You extract facts AND story angles from diffs. You never infer intent that is not written down, and you never invent numbers — but you are sharp at spotting what is genuinely interesting in a change.",
      }
    )

    await ctx.runMutation(internal.content.saveBrief, {
      draftId: args.draftId,
      version: args.version,
      brief: text,
    })

    return null
  },
})

/* -------------------------------------------------------------------------- */
/* Step 3 — research what actually performs on each platform                   */
/* -------------------------------------------------------------------------- */

export const researchFormats = internalAction({
  args: { draftId: v.id("contentDrafts"), version: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft: Doc<"contentDrafts"> | null = await ctx.runQuery(
      internal.content.getDraftInternal,
      { draftId: args.draftId }
    )
    if (!draft) return null

    const { text, sources } = await callGemini(
      `Research what is getting reach RIGHT NOW in build-in-public / indie-hacker / developer content on X, LinkedIn, Reddit, engineering blogs, and short-form video.

Topic of the upcoming posts: "${draft.headline}" — one specific change in ${draft.fullName}, written by the builder who shipped it.

What the project is (so the research fits the actual audience, not developers in general):
${(draft.repoProfile ?? "").slice(0, 2_000) || "(unknown project)"}

Search the web and report:

1. TRENDING RIGHT NOW — what build-in-public and dev-tool content is actually spreading this month: recurring themes, arguments devs are having, formats being copied, angles that feel fresh vs. exhausted. Name specifics, not categories.

2. PER PLATFORM (X, LinkedIn, Reddit, blog, short video):
- the post structure currently getting reach (hook, body shape, length, line breaks, formatting)
- hook patterns that are working for solo builders shipping features, with real example openings
- openings that get scrolled past or read as AI-written
- norms that get a post removed or downvoted (especially Reddit self-promotion rules)
- whether hashtags/emoji/links help or hurt right now
- one concrete example structure to imitate

3. VIRALITY MECHANICS — for this kind of content specifically: what makes devs quote-post, comment, or argue. Which of these are landing now: a strong opinion, a before/after, a real number, a failure admitted, a contrarian take, a "nobody talks about this", one vivid concrete detail. Rank them by what is currently working.

Be specific and current. No preamble.`,
      { search: true }
    )

    await ctx.runMutation(internal.content.saveResearch, {
      draftId: args.draftId,
      version: args.version,
      research: text,
      sources,
      model: model(),
    })

    return null
  },
})

/* -------------------------------------------------------------------------- */
/* Step 4 — write one channel                                                  */
/* -------------------------------------------------------------------------- */

const CHANNEL_BRIEF: Record<Channel, string> = {
  x: `A single X post, under 280 characters. Line 1 is the whole bet — a claim, a number, a before/after, or an admission, never a summary of what follows. No "excited to share", no thread bait, no hashtags unless one is load-bearing. One concrete detail from the code does more work than any adjective. End on something a dev can disagree with or ask about.`,
  linkedin: `A LinkedIn post, 120-220 words. First line must land alone — it is all most people see. Then short paragraphs, one idea each, plenty of white space. Structure: the problem you hit → what you tried → what you shipped → what you learned or still doubt. One real number or one real file/function name. No corporate voice, no "thrilled to announce", no emoji bullets. Close with a genuine question, not a CTA.`,
  reddit: `A Reddit self-post for a relevant developer subreddit: a title line, then the body in Reddit-flavored markdown. Reddit punishes polish — write like a person posting at 1am. Lead with the technical problem, not the product. Show the approach honestly, including what is still bad about it. Disclose it is your own project in one plain sentence. Invite critique on a specific decision, and mean it. No links stuffed in, no marketing cadence.`,
  blog: `A blog post in markdown, 400-700 words: an H1 that promises one specific thing, a lede that opens on the problem (not on "in this post"), 2-3 H2 sections, and a closing. Narrative: what broke, what you tried, what the code does now, the tradeoff you accepted. Real module and function names. Honest about what is unfinished.`,
  video: `A 45-70 second short-form video script with timestamps, spoken lines, and on-screen cues. First 3 seconds must be a concrete claim or a problem stated out loud — never a greeting or "in this video". Spoken like a builder talking to another builder, contractions and all. One visual beat per line. End on the open question, not a subscribe ask.`,
}

/**
 * The writing pass. The brief is the truth; the research is the format; this
 * prompt supplies the voice — a builder shipping in public, not a changelog.
 */
function writePrompt(
  draft: Doc<"contentDrafts">,
  channelId: Channel,
  previous: string | undefined
): string {
  return [
    `You are the builder who shipped this change, writing in public about it. First person, present tense, talking to other builders — not announcing to customers.`,
    ``,
    `SUBJECT: ${draft.headline}. Write about this one change only — the surrounding activity is context, not the topic.`,
    ``,
    `THE PROJECT (what you are building — its stack, layout and README; use it so the post reads like someone who knows this codebase, and so a stranger understands what the change is part of):`,
    draft.repoProfile ?? "(no codebase profile available)",
    ``,
    `CONTEXT (the brief the scan produced, plus anything the author told us — this is the source of truth):`,
    draft.context ?? draft.brief ?? "(no brief available)",
    ``,
    `RAW CHANGE (branch name, commit messages and the diff — cite specifics from here; never state anything it does not support):`,
    draft.sourceDigest ?? "(no diff available; rely on the activity list only)",
    ``,
    `PLATFORM RESEARCH (what is trending and what formats are getting reach right now — follow it):`,
    draft.research ?? "(no research available)",
    ``,
    draft.userContext
      ? `AUTHOR CONTEXT (highest priority — honor this framing exactly):\n${draft.userContext}\n`
      : ``,
    previous
      ? `PREVIOUS VERSION (revise it against the author context; keep what still works):\n${previous}\n`
      : ``,
    `HOW TO WRITE IT:`,
    `- Pick ONE angle from the brief and commit to it: the tension (what was broken before), the surprise, the opinion, or the relatable moment. Do not write a summary that touches all of them.`,
    `- Earn the first line. It carries the whole post: a claim, a number, a before/after, a mistake admitted, or a stated opinion. Never a label, never "I just shipped X", never a question you immediately answer.`,
    `- Use the virality mechanics the research ranked highest, but only ones this change actually supports.`,
    `- Show the mechanism. One real file, function, or constraint from the diff beats three sentences of description — specificity is what makes builders trust and share it.`,
    `- Build in public means the messy parts count: what you tried first, what you cut, what you still are not sure about. Include at least one honest limitation.`,
    `- Take a position where the brief gives you one. A post nobody can disagree with gets no replies.`,
    `- Sound like a person: contractions, varied sentence length, occasional fragment. No em-dash-heavy cadence, no tricolon lists, no "it's not just X, it's Y", no "game-changer", "seamless", "leverage", "unlock", "dive into", "in today's world".`,
    ``,
    `TASK: write the ${channelId} piece.`,
    CHANNEL_BRIEF[channelId],
    ``,
    `HARD RULES: every factual claim must trace to the context or the raw change above — if the brief lists it under UNKNOWNS or "not visible in this change", do not assert it. No invented numbers, no invented users, no fake metrics, no invented backstory. Hype is banned; a strong, honest opinion is not. Output the post text only — no preamble, no title unless the format calls for one, no meta commentary.`,
  ]
    .filter(Boolean)
    .join("\n")
}

export const writeChannel = internalAction({
  args: {
    draftId: v.id("contentDrafts"),
    version: v.number(),
    channel: v.union(
      v.literal("x"),
      v.literal("linkedin"),
      v.literal("reddit"),
      v.literal("blog"),
      v.literal("video")
    ),
    previous: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft: Doc<"contentDrafts"> | null = await ctx.runQuery(
      internal.content.getDraftInternal,
      { draftId: args.draftId }
    )
    if (!draft || draft.version !== args.version) return null

    const { text } = await callGemini(
      writePrompt(draft, args.channel, args.previous),
      {
        system:
          "You are a senior developer with a real audience who builds in public. You write the way the best indie builders post: specific, opinionated, honest about what broke, allergic to marketing voice and to anything that reads as AI-written. You never exaggerate, never invent a number or a user, and never write anything the diff does not support — but within the truth you always pick the sharpest, most shareable angle.",
      }
    )

    await ctx.runMutation(internal.content.savePiece, {
      draftId: args.draftId,
      version: args.version,
      channel: args.channel,
      body: text,
    })

    return null
  },
})
