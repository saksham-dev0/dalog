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
  type QueryCtx,
} from "./_generated/server"
import schema, { eventKind } from "./schema"

/** How long a workflow keeps polling before handing off to a fresh instance. */
const CYCLES_PER_WORKFLOW = 30

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

export const listWatched = query({
  args: {},
  returns: v.array(schema.doc("watchedRepos")),
  handler: async (ctx) => {
    const { ownerToken } = await requireIdentity(ctx)

    return await ctx.db
      .query("watchedRepos")
      .withIndex("by_owner", (q) => q.eq("ownerToken", ownerToken))
      .take(200)
  },
})

/** Live feed across every watched repo, or one repo when `repo` is given. */
export const listEvents = query({
  args: {
    paginationOpts: paginationOptsValidator,
    repo: v.optional(v.id("watchedRepos")),
  },
  returns: paginationResultValidator(schema.doc("repoEvents")),
  handler: async (ctx, args) => {
    const { ownerToken } = await requireIdentity(ctx)

    if (args.repo) {
      await requireOwnedRepo(ctx, args.repo)
      return await ctx.db
        .query("repoEvents")
        .withIndex("by_repo_and_occurredAt", (q) => q.eq("repo", args.repo!))
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

/** Stops watching: cancels the workflow, removes the hook, purges the events. */
export const unwatch = mutation({
  args: { repoId: v.id("watchedRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await requireOwnedRepo(ctx, args.repoId)

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

    for (const repo of repos) {
      await ctx.runMutation(api.repos.unwatch, { repoId: repo._id })
    }

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

/** The workflow checks this before every cycle so unwatching stops the loop. */
export const isWatching = internalQuery({
  args: { repoId: v.id("watchedRepos") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    return repo !== null && repo.status !== "error"
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
      }))

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
    })
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
 */
export const recordEvents = internalMutation({
  args: {
    repoId: v.id("watchedRepos"),
    source: v.union(v.literal("webhook"), v.literal("poll")),
    events: v.array(eventInput),
    syncedAt: v.optional(v.number()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("watchedRepos", args.repoId)
    if (!repo) return 0

    let inserted = 0
    const insertedMerges: Id<"repoEvents">[] = []
    for (const event of args.events) {
      const duplicate = await ctx.db
        .query("repoEvents")
        .withIndex("by_repo_and_externalId", (q) =>
          q.eq("repo", repo._id).eq("externalId", event.externalId)
        )
        .first()
      if (duplicate) continue

      const eventId = await ctx.db.insert("repoEvents", {
        ...event,
        repo: repo._id,
        ownerToken: repo.ownerToken,
        fullName: repo.fullName,
        source: args.source,
      })
      inserted += 1
      if (event.kind === "merge") insertedMerges.push(eventId)
    }

    await ctx.db.patch("watchedRepos", repo._id, {
      eventCount: repo.eventCount + inserted,
      lastSyncedAt: args.syncedAt ?? Date.now(),
      lastError: undefined,
    })

    return inserted
  },
})
