import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import { internalAction } from "./_generated/server"
import { CHANNELS, type Channel } from "./content"

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models"
/** Overridable per deployment; Flash is fast enough for a five-piece run. */
const DEFAULT_MODEL = "gemini-3.7-flash"
/** Diff text is the expensive part of the prompt — keep it bounded. */
const MAX_DIGEST_CHARS = 24_000
const MAX_PATCH_CHARS_PER_FILE = 2_000

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
    .slice(0, 12)
    .map((file) => {
      const header = `${file.status} ${file.filename} (+${file.additions}/-${file.deletions})`
      const patch = file.patch?.slice(0, MAX_PATCH_CHARS_PER_FILE) ?? ""

      return patch ? `${header}\n${patch}` : header
    })
    .join("\n\n")
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
    const name = repo.fullName
    const sections: string[] = [
      `Repository: ${name} (default branch ${repo.defaultBranch})`,
    ]

    if (subject) {
      sections.push(
        `Subject: ${subject.kind} / ${subject.action} — "${subject.title}" by ${subject.actor}${
          subject.branch ? ` on ${subject.branch}` : ""
        }`
      )
    }

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
          ? `Commits in this PR:\n${commits
              .map((c) => `- ${c.commit.message.split("\n")[0]}`)
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
            ? `Commits on the branch:\n${compare.commits
                .slice(0, 20)
                .map((c) => `- ${c.commit.message.split("\n")[0]}`)
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
    })

    return null
  },
})

/* -------------------------------------------------------------------------- */
/* Step 2 — research what actually performs on each platform                   */
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
      `Research how developer/technical content is performing RIGHT NOW on X, LinkedIn, Reddit, engineering blogs, and short-form video.

Topic of the upcoming posts: "${draft.headline}" — one specific change in ${draft.fullName}.

Search the web and report, per platform:
- the post structure that is currently getting reach (hook, body shape, length, line breaks, formatting)
- what openings get ignored
- norms that get a post removed or downvoted (especially Reddit self-promotion rules)
- whether hashtags/emoji/links help or hurt right now
- one concrete example structure to imitate

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
/* Step 3 — write one channel                                                  */
/* -------------------------------------------------------------------------- */

const CHANNEL_BRIEF: Record<Channel, string> = {
  x: `A single X (Twitter) post, under 280 characters. No hashtags unless one is genuinely load-bearing. Concrete specifics beat adjectives. Line breaks are allowed.`,
  linkedin: `A LinkedIn post, 120-220 words. Strong first line that reads well truncated. Short paragraphs, a concrete lesson or number, no corporate filler, no "excited to announce" opener.`,
  reddit: `A Reddit self-post for a relevant developer subreddit: a title line, then the body in Reddit-flavored markdown. Written as a builder sharing work and inviting critique, never as marketing. Disclose that it is your own project.`,
  blog: `A blog post in markdown, 400-700 words: an H1, a short lede, 2-3 H2 sections, and a closing. Technical, specific to the actual diff, and honest about tradeoffs.`,
  video: `A 45-70 second short-form video script with timestamps, spoken lines, and on-screen cues. Hook in the first 3 seconds. Written to be read aloud.`,
}

function writePrompt(
  draft: Doc<"contentDrafts">,
  channelId: Channel,
  previous: string | undefined
): string {
  return [
    `You are writing for the developer who made this change. First person, their voice, no hype.`,
    ``,
    `SUBJECT: ${draft.headline}. Write about this one change only — the surrounding activity is context, not the topic.`,
    ``,
    `WHAT CHANGED (source of truth — never invent anything not supported by this):`,
    draft.sourceDigest ?? "(no diff available; rely on the activity list only)",
    ``,
    `PLATFORM RESEARCH (current formats that perform):`,
    draft.research ?? "(no research available)",
    ``,
    draft.context
      ? `AUTHOR CONTEXT (highest priority — rewrite to honor this):\n${draft.context}\n`
      : ``,
    previous
      ? `PREVIOUS VERSION (revise it against the author context; keep what still works):\n${previous}\n`
      : ``,
    `TASK: write the ${channelId} piece.`,
    CHANNEL_BRIEF[channelId],
    ``,
    `Rules: only claims the diff supports; no placeholder text; no "as an AI"; no meta commentary. Output the post text only.`,
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
          "You are a senior developer who writes unusually well. You never exaggerate, and you never write anything the diff does not support.",
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
