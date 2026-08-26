/**
 * Placeholder data for the dashboard shell.
 * Nothing here is wired to GitHub or the generator yet — it exists so the
 * layouts can be reviewed with realistic shapes before the backend lands.
 */

export type WebhookStatus = "active" | "broken"

export type Repo = {
  id: string
  name: string
  branch: string
  connectedAt: string
  webhook: WebhookStatus
  private: boolean
}

export const repos: Repo[] = [
  {
    id: "dalog",
    name: "saksham-dev0/dalog",
    branch: "main",
    connectedAt: "Aug 12, 2026",
    webhook: "active",
    private: true,
  },
  {
    id: "orbit-cli",
    name: "saksham-dev0/orbit-cli",
    branch: "main",
    connectedAt: "Jul 30, 2026",
    webhook: "active",
    private: false,
  },
  {
    id: "notes-api",
    name: "saksham-dev0/notes-api",
    branch: "develop",
    connectedAt: "Jun 04, 2026",
    webhook: "broken",
    private: true,
  },
]

export type GenerationStatus = "done" | "generating" | "failed"

export type PushEvent = {
  id: string
  repo: string
  branch: string
  summary: string
  commits: number
  extraCommits: string[]
  when: string
  status: GenerationStatus
}

export const pushes: PushEvent[] = [
  {
    id: "9f31ab2",
    repo: "saksham-dev0/dalog",
    branch: "main",
    summary: "feat: content detail tabs + regenerate flow",
    commits: 3,
    extraCommits: [
      "refactor: pull tab state into a hook",
      "chore: drop unused example data",
    ],
    when: "12m ago",
    status: "generating",
  },
  {
    id: "4c0d7e1",
    repo: "saksham-dev0/orbit-cli",
    branch: "main",
    summary: "fix: retry webhook delivery with backoff",
    commits: 1,
    extraCommits: [],
    when: "2h ago",
    status: "done",
  },
  {
    id: "a77be40",
    repo: "saksham-dev0/dalog",
    branch: "main",
    summary: "feat: GitHub OAuth repo picker",
    commits: 5,
    extraCommits: [
      "test: cover the installation callback",
      "docs: note the required scopes",
    ],
    when: "Yesterday",
    status: "done",
  },
  {
    id: "1de99c3",
    repo: "saksham-dev0/notes-api",
    branch: "develop",
    summary: "perf: batch the tag lookups",
    commits: 2,
    extraCommits: ["chore: bump drizzle"],
    when: "Yesterday",
    status: "failed",
  },
  {
    id: "b204f8a",
    repo: "saksham-dev0/orbit-cli",
    branch: "main",
    summary: "feat: `orbit watch` streams logs to stdout",
    commits: 4,
    extraCommits: ["fix: flush on SIGINT"],
    when: "Aug 22",
    status: "done",
  },
]

export const pushesThisWeek = 7

export type ChannelId = "x" | "reddit" | "linkedin" | "blog" | "video"

export type Channel = {
  id: ChannelId
  label: string
  /** Only X has a hard limit worth counting against. */
  limit?: number
  draft: string
}

export const channels: Channel[] = [
  {
    id: "x",
    label: "X posts",
    limit: 280,
    draft: `Shipped the content detail view today.

One push → five drafts, each one editable before it goes anywhere. The AI reads the diff, you keep the veto.

Still no auto-posting. That's on purpose.`,
  },
  {
    id: "reddit",
    label: "Reddit",
    draft: `**Built a thing that turns git pushes into draft posts**

I kept shipping features and never writing about them. So the webhook now reads the diff and drafts something for each channel I actually use.

The part I care about: nothing posts itself. Every draft lands in an editor first, and there's a free-text box where I add context the diff can't show — why the change happened, what it replaced.

Happy to answer questions about the generation prompt.`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    draft: `Most engineering work is invisible because writing about it is a second job.

This week I wired a GitHub webhook into a drafting pipeline: every push to a watched branch produces channel-specific drafts, ready to edit.

Three things I got wrong first:
→ Generating from commit messages alone. The diff carries the story.
→ Auto-posting. Nobody wants that on day one.
→ Skipping manual context. The author always knows something the code doesn't.`,
  },
  {
    id: "blog",
    label: "Blog",
    draft: `# Turning a git push into a first draft

Every developer I know has the same gap: the work ships, the writing doesn't. Not from laziness — the context is loudest right when you push, and gone an hour later.

## The pipeline

A webhook fires on push to the watched branch. We pull the commit range, collapse it into a diff summary, and hand that to the model with a per-channel prompt.

## Why nothing posts automatically

Because a draft written from a diff is a hypothesis about what mattered…`,
  },
  {
    id: "video",
    label: "Video script",
    draft: `[0:00] Cold open — terminal, git push running.
"This push is about to write five posts."

[0:08] Cut to dashboard. New row appears, status: generating.
"The webhook picks it up. No copy-paste, no prompt writing."

[0:20] Open the detail view. Tab through X, Reddit, LinkedIn.
"Each channel gets its own draft, from the same diff."

[0:35] Type into the context box, hit regenerate.
"And where the diff misses the point — you tell it."`,
  },
]

export const diffSample = `diff --git a/app/dashboard/page.tsx b/app/dashboard/page.tsx
@@ -1,32 +1,18 @@
-import { StatCard } from "@/components/dashboard/stat-card"
+import { FeedRow } from "@/components/dashboard/feed-row"

-  const stats = [...]
+  const feed = pushes.map((push) => <FeedRow key={push.id} {...push} />)`
