import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { internalAction, type ActionCtx } from "./_generated/server"

const GITHUB_API = "https://api.github.com"
const CLERK_API = "https://api.clerk.com/v1"
/** Events dalog cares about: commits, PRs/merges, and branch create/delete. */
const HOOK_EVENTS = ["push", "pull_request", "create", "delete"]

type EventInput = {
  kind: "commit" | "pull_request" | "merge" | "branch"
  action: string
  title: string
  actor: string
  url: string
  branch?: string
  sha?: string
  number?: number
  occurredAt: number
  externalId: string
}

/**
 * Clerk holds the user's GitHub OAuth token and refreshes it, so we ask Clerk
 * for a fresh one on every sync rather than storing a copy.
 */
async function getGithubToken(clerkUserId: string): Promise<string> {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) throw new Error("CLERK_SECRET_KEY is not set on this deployment")

  const res = await fetch(
    `${CLERK_API}/users/${clerkUserId}/oauth_access_tokens/github`,
    { headers: { Authorization: `Bearer ${secret}` } }
  )
  if (!res.ok) {
    throw new Error(`Clerk refused the GitHub token (${res.status})`)
  }

  const body: unknown = await res.json()
  // Clerk returns a bare array on older API versions, `{ data: [...] }` on newer.
  const tokens = Array.isArray(body)
    ? body
    : typeof body === "object" && body !== null && "data" in body
      ? (body as { data: unknown }).data
      : null
  const first = Array.isArray(tokens) ? tokens[0] : null
  const token =
    typeof first === "object" && first !== null && "token" in first
      ? (first as { token: unknown }).token
      : null

  if (typeof token !== "string") throw new Error("No GitHub token on this user")

  return token
}

async function githubFetch(
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
}

async function githubJson<T>(token: string, path: string): Promise<T> {
  const res = await githubFetch(token, path)
  if (!res.ok) throw new Error(`GitHub ${path} failed (${res.status})`)

  return (await res.json()) as T
}

type CommitJson = {
  sha: string
  html_url: string
  commit: { message: string; author: { name?: string; date?: string } | null }
  author: { login?: string } | null
}

type PullJson = {
  number: number
  title: string
  html_url: string
  state: string
  merged_at: string | null
  created_at: string
  updated_at: string
  head: { ref: string }
  user: { login?: string } | null
}

type BranchJson = { name: string; commit: { sha: string } }

/**
 * One pass over a repo: recent commits on the default branch, recently touched
 * pull requests, and the branch list. `recordEvents` drops anything already
 * stored, so overlapping passes are free.
 */
async function syncRepoOnce(
  ctx: ActionCtx,
  repoId: Id<"watchedRepos">
): Promise<number> {
  const repo = await ctx.runQuery(internal.repos.getRepo, { repoId })
  if (!repo) return 0

  const token = await getGithubToken(repo.clerkUserId)
  const name = repo.fullName
  // A little overlap on re-sync beats missing commits pushed mid-sync.
  const since = repo.lastSyncedAt
    ? `&since=${new Date(repo.lastSyncedAt - 60_000).toISOString()}`
    : ""

  const [commits, pulls, branches] = await Promise.all([
    githubJson<CommitJson[]>(
      token,
      `/repos/${name}/commits?sha=${encodeURIComponent(repo.defaultBranch)}&per_page=30${since}`
    ),
    githubJson<PullJson[]>(
      token,
      `/repos/${name}/pulls?state=all&sort=updated&direction=desc&per_page=30`
    ),
    githubJson<BranchJson[]>(token, `/repos/${name}/branches?per_page=100`),
  ])

  const events: EventInput[] = []

  for (const commit of commits) {
    events.push({
      kind: "commit",
      action: "pushed",
      title: commit.commit.message.split("\n")[0] ?? commit.sha,
      actor: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
      url: commit.html_url,
      branch: repo.defaultBranch,
      sha: commit.sha,
      occurredAt: commit.commit.author?.date
        ? Date.parse(commit.commit.author.date)
        : Date.now(),
      externalId: `commit:${commit.sha}`,
    })
  }

  for (const pull of pulls) {
    const merged = pull.merged_at !== null
    // One event per state the PR reached, so a merge does not overwrite the open.
    events.push({
      kind: "pull_request",
      action: "opened",
      title: pull.title,
      actor: pull.user?.login ?? "unknown",
      url: pull.html_url,
      branch: pull.head.ref,
      number: pull.number,
      occurredAt: Date.parse(pull.created_at),
      externalId: `pr:${pull.number}:opened`,
    })

    if (merged) {
      events.push({
        kind: "merge",
        action: "merged",
        title: pull.title,
        actor: pull.user?.login ?? "unknown",
        url: pull.html_url,
        branch: pull.head.ref,
        number: pull.number,
        occurredAt: Date.parse(pull.merged_at!),
        externalId: `pr:${pull.number}:merged`,
      })
    } else if (pull.state === "closed") {
      events.push({
        kind: "pull_request",
        action: "closed",
        title: pull.title,
        actor: pull.user?.login ?? "unknown",
        url: pull.html_url,
        branch: pull.head.ref,
        number: pull.number,
        occurredAt: Date.parse(pull.updated_at),
        externalId: `pr:${pull.number}:closed`,
      })
    }
  }

  for (const branch of branches) {
    // Polling can only see that a branch exists; deletions arrive by webhook.
    events.push({
      kind: "branch",
      action: "created",
      title: branch.name,
      actor: "unknown",
      url: `${repo.htmlUrl}/tree/${branch.name}`,
      branch: branch.name,
      sha: branch.commit.sha,
      occurredAt: Date.now(),
      externalId: `branch:${branch.name}`,
    })
  }

  return await ctx.runMutation(internal.repos.recordEvents, {
    repoId,
    source: "poll",
    events,
    syncedAt: Date.now(),
  })
}

/**
 * Registers the push webhook (instant events) and backfills once, then flips
 * the repo to `watching`, which starts the polling workflow.
 */
export const setupWatch = internalAction({
  args: { repoId: v.id("watchedRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.runQuery(internal.repos.getRepo, {
      repoId: args.repoId,
    })
    if (!repo) return null

    try {
      const token = await getGithubToken(repo.clerkUserId)
      const secret = crypto.randomUUID()
      const res = await githubFetch(token, `/repos/${repo.fullName}/hooks`, {
        method: "POST",
        body: JSON.stringify({
          name: "web",
          active: true,
          events: HOOK_EVENTS,
          config: {
            url: `${process.env.CONVEX_SITE_URL}/github/webhook`,
            content_type: "json",
            insecure_ssl: "0",
            secret,
          },
        }),
      })

      // 403/404 here just means the grant has no admin:repo_hook — poll instead.
      if (res.ok) {
        const hook = (await res.json()) as { id: number }
        await ctx.runMutation(internal.repos.markWatching, {
          repoId: args.repoId,
          delivery: "webhook",
          webhookId: hook.id,
          webhookSecret: secret,
        })
      } else {
        await ctx.runMutation(internal.repos.markWatching, {
          repoId: args.repoId,
          delivery: "polling",
        })
      }

      await syncRepoOnce(ctx, args.repoId)
    } catch (error) {
      await ctx.runMutation(internal.repos.markError, {
        repoId: args.repoId,
        message: error instanceof Error ? error.message : "Sync failed",
      })
    }

    return null
  },
})

export const teardownWatch = internalAction({
  args: {
    clerkUserId: v.string(),
    fullName: v.string(),
    webhookId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const token = await getGithubToken(args.clerkUserId)
      await githubFetch(
        token,
        `/repos/${args.fullName}/hooks/${args.webhookId}`,
        {
          method: "DELETE",
        }
      )
    } catch {
      // The repo row is already gone; a stale hook is not worth failing over.
    }

    return null
  },
})

/** One polling cycle. The workflow calls this on a loop. */
export const syncRepo = internalAction({
  args: { repoId: v.id("watchedRepos") },
  returns: v.number(),
  handler: async (ctx, args) => await syncRepoOnce(ctx, args.repoId),
})
