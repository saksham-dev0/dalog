import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import { v } from "convex/values"
import { cancel, start, type WorkflowId } from "@convex-dev/workflow"

import { api, components, internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import schema, { eventKind } from "./schema"
import { CLEANUP_ON_COMPLETE } from "./workflowOptions"

/** How long a workflow keeps polling before handing off to a fresh instance. */
/**
 * Cycles per polling workflow. The journal is re-read on every step, so cost
 * inside one workflow grows with the square of its length — a long-lived
 * journal is what pushes the component's mutations over the system-operation
 * limit. Handing off more often keeps each journal short.
 */
export const CYCLES_PER_WORKFLOW = 10

/**
 * How often a poll is allowed to touch `watchedRepos` just to move
 * `lastSyncedAt` forward. The field only drives the "last synced" line in the
 * UI and the stalled-watch cron, so a patch per poll bought nothing and cost a
 * full-document rewrite plus an invalidation of every `listWatched`
 * subscription — it is what the OCC retries on this table were.
 */
const SYNCED_AT_THROTTLE_MS = 5 * 60_000

/**
 * Poll cadence, by how the repo actually receives changes. A repo with a
 * working webhook is already instant; its poll is only a safety net, so it runs
 * 10x less often. Kept here rather than in the workflow because it is a
 * property of the repo row.
 */
const POLL_INTERVAL_WEBHOOK_MS = 10 * 60_000
const POLL_INTERVAL_POLLING_MS = 2 * 60_000

type Identity = { ownerToken: string; clerkUserId: string }

async function requireIdentity(ctx: QueryCtx): Promise<Identity> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")

  return { ownerToken: identity.tokenIdentifier, clerkUserId: identity.subject }
}

/** Loads a repo and proves the caller owns it. */
async function requireOwnedRepo(
  ctx: QueryCtx,
  repoId: Id<"watchedRepos">
): Promise<Doc<"watchedRepos">> {
  const { ownerToken } = await requireIdentity(ctx)
  const repo = await ctx.db.get("watchedRepos", repoId)
  if (!repo || repo.ownerToken !== ownerToken) throw new Error("Repo not found")

  return repo
}

/**
 * What the UI reads off a watch row — and nothing else. The full document also
 * carries `ownerToken`, `clerkUserId`, `workflowId`, `webhookId` and
 * `webhookSecret`; returning it shipped the webhook's HMAC signing key to every
 * subscribed browser, which is enough to forge deliveries to the hook endpoint.
 */
const watchedRepoSummary = v.object({
  _id: v.id("watchedRepos"),
  _creationTime: v.number(),
  fullName: v.string(),
  status: schema.doc("watchedRepos").fields.status,
  delivery: schema.doc("watchedRepos").fields.delivery,
  eventCount: v.number(),
  lastSyncedAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
})

function toWatchedRepoSummary(repo: Doc<"watchedRepos">) {
  return {
    _id: repo._id,
    _creationTime: repo._creationTime,
    fullName: repo.fullName,
    status: repo.status,
    delivery: repo.delivery,
    eventCount: repo.eventCount,
    lastSyncedAt: repo.lastSyncedAt,
    lastError: repo.lastError,
  }
}

export const listWatched = query({
  args: {},
  returns: v.array(watchedRepoSummary),
  handler: async (ctx) => {
    const { ownerToken } = await requireIdentity(ctx)
    const repos = await ctx.db
      .query("watchedRepos")
      .withIndex("by_owner", (q) => q.eq("ownerToken", ownerToken))
      .take(200)

    return repos.map(toWatchedRepoSummary)
  },
})

/**
 * The watch count on its own, for the sidebar and the settings line — both of
 * which only ever rendered `listWatched(...).length` while holding a live
 * subscription to every repo document.
 *
 * This still reads the same rows (Convex has no count operator), so it does not
 * cut database bandwidth; what it cuts is the payload pushed to the client and
 * the re-render, on a subscription the sidebar holds on every dashboard page.
 */
export const countWatched = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const { ownerToken } = await requireIdentity(ctx)
    const repos = await ctx.db
      .query("watchedRepos")
      .withIndex("by_owner", (q) => q.eq("ownerToken", ownerToken))
      .take(200)

    return repos.length
  },
})

/**
 * Live feed for the activity page: every watched repo, or one repo, and
 * either every kind of change or just one. Each combination has its own
 * index, so a filtered feed reads exactly the rows it returns.
 */
export const listEvents = query({
  args: {
    paginationOpts: paginationOptsValidator,
    repo: v.optional(v.id("watchedRepos")),
    kind: v.optional(eventKind),
  },
  returns: paginationResultValidator(schema.doc("repoEvents")),
  handler: async (ctx, args) => {
    const { ownerToken } = await requireIdentity(ctx)
    const { repo, kind } = args

    if (repo) await requireOwnedRepo(ctx, repo)

    if (repo && kind) {
      return await ctx.db
        .query("repoEvents")
        .withIndex("by_repo_kind_and_occurredAt", (q) =>
          q.eq("repo", repo).eq("kind", kind)
        )
        .order("desc")
        .paginate(args.paginationOpts)
    }

    if (repo) {
      return await ctx.db
        .query("repoEvents")
        .withIndex("by_repo_and_occurredAt", (q) => q.eq("repo", repo))
        .order("desc")
        .paginate(args.paginationOpts)
    }

    if (kind) {
      return await ctx.db
        .query("repoEvents")
        .withIndex("by_owner_kind_and_occurredAt", (q) =>
          q.eq("ownerToken", ownerToken).eq("kind", kind)
        )
        .order("desc")
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query("repoEvents")
      .withIndex("by_owner_and_occurredAt", (q) =>
        q.eq("ownerToken", ownerToken)
      )
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

/**
 * Starts watching a repo: the row lands immediately (so the UI flips now) and
 * an action registers the webhook and kicks off the polling workflow.
 */
export const watch = mutation({
  args: {
    fullName: v.string(),
    githubRepoId: v.number(),
    defaultBranch: v.string(),
    isPrivate: v.boolean(),
    htmlUrl: v.string(),
  },
  returns: v.id("watchedRepos"),
  handler: async (ctx, args) => {
    const { ownerToken, clerkUserId } = await requireIdentity(ctx)

    const existing = await ctx.db
      .query("watchedRepos")
      .withIndex("by_owner_and_fullName", (q) =>
        q.eq("ownerToken", ownerToken).eq("fullName", args.fullName)
      )
      .unique()
    if (existing) return existing._id

    const repoId = await ctx.db.insert("watchedRepos", {
      ownerToken,
      clerkUserId,
      fullName: args.fullName,
      githubRepoId: args.githubRepoId,
      defaultBranch: args.defaultBranch,
      isPrivate: args.isPrivate,
      htmlUrl: args.htmlUrl,
      status: "pending",
      delivery: "polling",
      eventCount: 0,
    })

    await ctx.scheduler.runAfter(0, internal.github.setupWatch, { repoId })

    return repoId
  },
})

/**
 * The teardown itself, on a repo the caller has already loaded and proved it
 * owns. Split out so `unwatchAll` can loop over rows it already holds instead
 * of calling `unwatch` per repo — that re-ran `getUserIdentity()` and re-read
 * the repo document once for every repo.
 */
async function tearDownWatch(
  ctx: MutationCtx,
  repo: Doc<"watchedRepos">
): Promise<void> {
  if (repo.workflowId) {
    await cancel(ctx, components.workflow, repo.workflowId as WorkflowId)
  }
  if (repo.webhookId !== undefined) {
    await ctx.scheduler.runAfter(0, internal.github.teardownWatch, {
      clerkUserId: repo.clerkUserId,
      fullName: repo.fullName,
      webhookId: repo.webhookId,
    })
  }
  await ctx.scheduler.runAfter(0, internal.repos.purgeRepo, {
    repoId: repo._id,
  })
}

/** Stops watching: cancels the workflow, removes the hook, purges the events. */
export const unwatch = mutation({
  args: { repoId: v.id("watchedRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await requireOwnedRepo(ctx, args.repoId)
    await tearDownWatch(ctx, repo)

    return null
  },
})

/** Used when the GitHub account is unlinked — every watch goes with it. */
export const unwatchAll = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    const { ownerToken } = await requireIdentity(ctx)
    const repos = await ctx.db
      .query("watchedRepos")
      .withIndex("by_owner", (q) => q.eq("ownerToken", ownerToken))
      .take(200)

    for (const repo of repos) await tearDownWatch(ctx, repo)

    return repos.length
  },
})

/** Deletes a repo's events a batch at a time, then the repo row itself. */
export const purgeRepo = internalMutation({
  args: { repoId: v.id("watchedRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("repoEvents")
      .withIndex("by_repo_and_occurredAt", (q) => q.eq("repo", args.repoId))
      .take(200)

    for (const event of batch) {
      await ctx.db.delete("repoEvents", event._id)
    }

    if (batch.length === 200) {
      await ctx.scheduler.runAfter(0, internal.repos.purgeRepo, args)
      return null
    }

    const profile = await ctx.db
      .query("repoProfiles")
      .withIndex("by_repo", (q) => q.eq("repo", args.repoId))
      .unique()
    if (profile) await ctx.db.delete("repoProfiles", profile._id)

    const state = await ctx.db
      .query("repoSyncState")
      .withIndex("by_repo", (q) => q.eq("repo", args.repoId))
      .unique()
    if (state) await ctx.db.delete("repoSyncState", state._id)

    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (repo) await ctx.db.delete("watchedRepos", repo._id)

    return null
  },
})

export const getRepo = internalQuery({
  args: { repoId: v.id("watchedRepos") },
  returns: v.union(schema.doc("watchedRepos"), v.null()),
  handler: async (ctx, args) => await ctx.db.get("watchedRepos", args.repoId),
})

/**
 * Caches the codebase profile the scan builds, so the next scan reuses it.
 * Lands in `repoProfiles`, not on the repo row — see the schema comment.
 */
export const saveProfile = internalMutation({
  args: { repoId: v.id("watchedRepos"), repoProfile: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo) return null

    const existing = await ctx.db
      .query("repoProfiles")
      .withIndex("by_repo", (q) => q.eq("repo", repo._id))
      .unique()

    if (existing) {
      await ctx.db.patch("repoProfiles", existing._id, {
        profile: args.repoProfile,
        profiledAt: Date.now(),
      })
      return null
    }

    await ctx.db.insert("repoProfiles", {
      repo: repo._id,
      profile: args.repoProfile,
      profiledAt: Date.now(),
    })

    return null
  },
})

/**
 * The cached profile, or null. Falls back to the legacy column on the repo row
 * so a repo profiled before the split still reads; delete the fallback with the
 * legacy fields themselves.
 */
export const getProfile = internalQuery({
  args: { repoId: v.id("watchedRepos") },
  returns: v.union(
    v.object({ profile: v.string(), profiledAt: v.number() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("repoProfiles")
      .withIndex("by_repo", (q) => q.eq("repo", args.repoId))
      .unique()
    if (row) return { profile: row.profile, profiledAt: row.profiledAt }

    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo?.repoProfile) return null

    return { profile: repo.repoProfile, profiledAt: repo.profiledAt ?? 0 }
  },
})

/**
 * The workflow checks this before every cycle so unwatching stops the loop,
 * and takes its sleep length from the same read — a repo whose webhook is
 * working does not need a 60-second poll.
 */
export const pollPlan = internalQuery({
  args: { repoId: v.id("watchedRepos") },
  returns: v.object({
    watching: v.boolean(),
    pollIntervalMs: v.number(),
    since: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo || repo.status === "error") {
      return { watching: false, pollIntervalMs: POLL_INTERVAL_POLLING_MS }
    }

    const state = await ctx.db
      .query("repoSyncState")
      .withIndex("by_repo", (q) => q.eq("repo", repo._id))
      .unique()

    return {
      watching: true,
      pollIntervalMs:
        repo.delivery === "webhook"
          ? POLL_INTERVAL_WEBHOOK_MS
          : POLL_INTERVAL_POLLING_MS,
      // The exact last poll time, which `lastSyncedAt` no longer tracks.
      since: state?.polledAt ?? repo.lastSyncedAt,
    }
  },
})

export const findByGithubRepoId = internalQuery({
  args: { githubRepoId: v.number() },
  returns: v.array(schema.doc("watchedRepos")),
  handler: async (ctx, args) =>
    await ctx.db
      .query("watchedRepos")
      .withIndex("by_githubRepoId", (q) =>
        q.eq("githubRepoId", args.githubRepoId)
      )
      .take(50),
})

/** Called once the hook is (or isn't) in place; this is what starts polling. */
export const markWatching = internalMutation({
  args: {
    repoId: v.id("watchedRepos"),
    delivery: v.union(v.literal("webhook"), v.literal("polling")),
    webhookId: v.optional(v.number()),
    webhookSecret: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo) return null

    const workflowId =
      repo.workflowId ??
      (await start(ctx, internal.workflows.syncRepoWorkflow, {
        repoId: repo._id,
        cycles: CYCLES_PER_WORKFLOW,
      }, CLEANUP_ON_COMPLETE))

    await ctx.db.patch("watchedRepos", repo._id, {
      status: "watching",
      delivery: args.delivery,
      webhookId: args.webhookId,
      webhookSecret: args.webhookSecret,
      workflowId,
      lastError: undefined,
    })

    return null
  },
})

/** Hands off to a fresh workflow so a journal never grows without bound. */
export const continueWatching = internalMutation({
  args: { repoId: v.id("watchedRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo || repo.status === "error") return null

    const workflowId = await start(ctx, internal.workflows.syncRepoWorkflow, {
      repoId: repo._id,
      cycles: CYCLES_PER_WORKFLOW,
    }, CLEANUP_ON_COMPLETE)
    await ctx.db.patch("watchedRepos", repo._id, { workflowId })

    return null
  },
})

export const markError = internalMutation({
  args: { repoId: v.id("watchedRepos"), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo) return null

    await ctx.db.patch("watchedRepos", repo._id, {
      status: "error",
      lastError: args.message,
    })

    return null
  },
})

const eventInput = v.object({
  kind: eventKind,
  action: v.string(),
  title: v.string(),
  actor: v.string(),
  url: v.string(),
  branch: v.optional(v.string()),
  sha: v.optional(v.string()),
  number: v.optional(v.number()),
  occurredAt: v.number(),
  externalId: v.string(),
})

/**
 * Writes new events for a repo. Webhook and poll both land here, so the
 * `externalId` check is what keeps a polled commit from doubling a pushed one.
 *
 * `fingerprint` is the poller's shortcut. Each cycle re-derives the same ~160
 * events (100 branches and 30 PRs never change), and the dedupe check reads a
 * full document per event — ~104KB of reads per poll to insert nothing. Since
 * dedupe depends on nothing but the set of `externalId`s, an unchanged
 * fingerprint proves the set is unchanged and the loop can be skipped whole.
 * The webhook path passes no fingerprint and always takes the long road.
 */
export const recordEvents = internalMutation({
  args: {
    repoId: v.id("watchedRepos"),
    source: v.union(v.literal("webhook"), v.literal("poll")),
    events: v.array(eventInput),
    syncedAt: v.optional(v.number()),
    fingerprint: v.optional(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo) return 0

    const now = args.syncedAt ?? Date.now()
    const state = await ctx.db
      .query("repoSyncState")
      .withIndex("by_repo", (q) => q.eq("repo", repo._id))
      .unique()

    /**
     * Cheap row; safe to write on every poll. A webhook delivery must not move
     * `polledAt` — that is the poller's `since` cursor, and advancing it on an
     * event the poller never derived would narrow its next window for no
     * reason.
     */
    const touchSyncState = async (fingerprint: string | undefined) => {
      const polledAt = args.source === "poll" ? now : undefined

      if (state) {
        await ctx.db.patch("repoSyncState", state._id, {
          polledAt: polledAt ?? state.polledAt,
          eventsFingerprint: fingerprint ?? state.eventsFingerprint,
        })
        return
      }

      await ctx.db.insert("repoSyncState", {
        repo: repo._id,
        polledAt: polledAt ?? 0,
        eventsFingerprint: fingerprint,
      })
    }

    /**
     * Expensive row: a full-document rewrite that invalidates `listWatched`.
     * Only worth it when something actually changed, or when the cron would
     * otherwise mistake the repo for stalled.
     */
    const touchRepo = async (inserted: number) => {
      const stale = now - (repo.lastSyncedAt ?? 0) > SYNCED_AT_THROTTLE_MS
      if (inserted === 0 && !stale && repo.lastError === undefined) return

      await ctx.db.patch("watchedRepos", repo._id, {
        eventCount: repo.eventCount + inserted,
        lastSyncedAt: now,
        lastError: undefined,
      })
    }

    if (
      args.fingerprint !== undefined &&
      args.fingerprint === state?.eventsFingerprint
    ) {
      await touchSyncState(args.fingerprint)
      await touchRepo(0)

      return 0
    }

    let inserted = 0
    for (const event of args.events) {
      const duplicate = await ctx.db
        .query("repoEvents")
        .withIndex("by_repo_and_externalId", (q) =>
          q.eq("repo", repo._id).eq("externalId", event.externalId)
        )
        .first()
      if (duplicate) continue

      await ctx.db.insert("repoEvents", {
        ...event,
        repo: repo._id,
        ownerToken: repo.ownerToken,
        fullName: repo.fullName,
        source: args.source,
      })
      inserted += 1
    }

    await touchSyncState(args.fingerprint)
    await touchRepo(inserted)

    return inserted
  },
})
