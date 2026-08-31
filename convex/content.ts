import { v } from "convex/values"
import { start } from "@convex-dev/workflow"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import schema, { channel } from "./schema"
import { CLEANUP_ON_COMPLETE } from "./workflowOptions"

export const CHANNELS = ["x", "linkedin", "reddit", "blog", "video"] as const
export type Channel = (typeof CHANNELS)[number]

/** Sibling events kept alongside the subject as context. */
const MAX_SOURCE_EVENTS = 20

async function requireOwnerToken(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")

  return identity.tokenIdentifier
}

async function requireOwnedDraft(
  ctx: QueryCtx,
  draftId: Id<"contentDrafts">
): Promise<Doc<"contentDrafts">> {
  const ownerToken = await requireOwnerToken(ctx)
  const draft = await ctx.db.get("contentDrafts", draftId)
  if (!draft || draft.ownerToken !== ownerToken)
    throw new Error("Draft not found")

  return draft
}

export const listDrafts = query({
  args: {},
  returns: v.array(schema.doc("contentDrafts")),
  handler: async (ctx) => {
    const ownerToken = await requireOwnerToken(ctx)

    return await ctx.db
      .query("contentDrafts")
      .withIndex("by_owner", (q) => q.eq("ownerToken", ownerToken))
      .order("desc")
      .take(50)
  },
})

/** The detail view: the draft, its pieces, and the events it was written from. */
export const getDraft = query({
  args: { draftId: v.id("contentDrafts") },
  returns: v.object({
    draft: schema.doc("contentDrafts"),
    subject: v.union(schema.doc("repoEvents"), v.null()),
    pieces: v.array(schema.doc("contentPieces")),
    events: v.array(schema.doc("repoEvents")),
  }),
  handler: async (ctx, args) => {
    const draft = await requireOwnedDraft(ctx, args.draftId)
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_draft", (q) => q.eq("draft", draft._id))
      .take(20)

    const events: Doc<"repoEvents">[] = []
    for (const eventId of draft.sourceEvents.slice(0, MAX_SOURCE_EVENTS)) {
      const event = await ctx.db.get("repoEvents", eventId)
      if (event) events.push(event)
    }

    const subject = draft.sourceEvent
      ? await ctx.db.get("repoEvents", draft.sourceEvent)
      : null

    return { draft, subject, pieces, events }
  },
})

/** A short label for the thing being written about. */
function subjectLabel(event: Doc<"repoEvents">): string {
  if (event.kind === "commit") return `Commit: ${event.title}`
  if (event.kind === "branch") return `Branch: ${event.title}`

  return `${event.kind === "merge" ? "Merged" : "PR"} #${event.number}: ${event.title}`
}

/** Events around the subject, so the model can see what it sits next to. */
async function siblingEvents(
  ctx: QueryCtx,
  event: Doc<"repoEvents">,
): Promise<Doc<"repoEvents">[]> {
  const recent = await ctx.db
    .query("repoEvents")
    .withIndex("by_repo_and_occurredAt", (q) => q.eq("repo", event.repo))
    .order("desc")
    .take(60)

  return recent
    .filter((sibling) => sibling._id !== event._id)
    .slice(0, MAX_SOURCE_EVENTS)
}

/**
 * Opens (or reuses) the draft for one commit, PR, merge or branch and kicks
 * off the background scan. The UI navigates here on a click in the feed, so
 * this must return fast — the reading and research happen in the workflow.
 */
export const openEventDraft = mutation({
  args: { eventId: v.id("repoEvents") },
  returns: v.id("contentDrafts"),
  handler: async (ctx, args) => {
    const ownerToken = await requireOwnerToken(ctx)
    const event = await ctx.db.get("repoEvents", args.eventId)
    if (!event || event.ownerToken !== ownerToken) throw new Error("Event not found")

    const existing = await ctx.db
      .query("contentDrafts")
      .withIndex("by_sourceEvent", (q) => q.eq("sourceEvent", event._id))
      .first()
    // A finished or in-flight scan is reused. A failed one, or one from before
    // the scan produced a brief, is scanned again.
    if (existing && existing.status !== "error" && existing.brief) {
      return existing._id
    }

    const siblings = await siblingEvents(ctx, event)
    const draftId =
      existing?._id ??
      (await ctx.db.insert("contentDrafts", {
        repo: event.repo,
        ownerToken,
        fullName: event.fullName,
        headline: subjectLabel(event),
        status: "pending",
        sourceEvent: event._id,
        sourceEvents: siblings.map((sibling) => sibling._id),
        model: "",
        version: 1,
      }))

    if (existing) {
      await ctx.db.patch("contentDrafts", draftId, {
        status: "pending",
        error: undefined,
      })
    }

    const workflowId = await start(ctx, internal.workflows.scanEventWorkflow, {
      draftId,
      version: existing?.version ?? 1,
    }, CLEANUP_ON_COMPLETE)
    await ctx.db.patch("contentDrafts", draftId, { workflowId })

    return draftId
  },
})

/** Writes the five pieces from a scan that has already landed. */
export const generatePieces = mutation({
  args: { draftId: v.id("contentDrafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await requireOwnedDraft(ctx, args.draftId)
    if (draft.status !== "scanned" && draft.status !== "ready") {
      throw new Error("The scan is not finished yet")
    }

    const version = draft.version + 1
    await ctx.db.patch("contentDrafts", draft._id, {
      status: "writing",
      version,
      error: undefined,
    })

    const workflowId = await start(ctx, internal.workflows.writeContentWorkflow, {
      draftId: draft._id,
      version,
    }, CLEANUP_ON_COMPLETE)
    await ctx.db.patch("contentDrafts", draft._id, { workflowId })

    return null
  },
})

/**
 * Auto-scan: a merge landed on a watched repo, so have the context ready
 * before the user even opens it. Writing still waits for an explicit click.
 */
export const maybeScanMergedEvent = internalMutation({
  args: { eventId: v.id("repoEvents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("repoEvents", args.eventId)
    if (!event) return null

    const existing = await ctx.db
      .query("contentDrafts")
      .withIndex("by_sourceEvent", (q) => q.eq("sourceEvent", event._id))
      .first()
    if (existing) return null

    const siblings = await siblingEvents(ctx, event)
    const draftId = await ctx.db.insert("contentDrafts", {
      repo: event.repo,
      ownerToken: event.ownerToken,
      fullName: event.fullName,
      headline: subjectLabel(event),
      status: "pending",
      sourceEvent: event._id,
      sourceEvents: siblings.map((sibling) => sibling._id),
      model: "",
      version: 1,
    })

    const workflowId = await start(ctx, internal.workflows.scanEventWorkflow, {
      draftId,
      version: 1,
    }, CLEANUP_ON_COMPLETE)
    await ctx.db.patch("contentDrafts", draftId, { workflowId })

    return null
  },
})

/**
 * Saves the author's context without writing anything — used before the first
 * generation, so the posts are written with it from the start.
 */
export const setUserContext = mutation({
  args: { draftId: v.id("contentDrafts"), context: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await requireOwnedDraft(ctx, args.draftId)
    const userContext = args.context.trim() || undefined

    await ctx.db.patch("contentDrafts", draft._id, {
      userContext,
      context: mergeContext(draft.brief, userContext),
    })

    return null
  },
})

/** Adds the user's own context and rewrites every piece against it. */
export const addContextAndRewrite = mutation({
  args: { draftId: v.id("contentDrafts"), context: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await requireOwnedDraft(ctx, args.draftId)
    const version = draft.version + 1

    const userContext = args.context.trim() || undefined
    await ctx.db.patch("contentDrafts", draft._id, {
      userContext,
      // Never drop the scan's brief — the note is added to it, not swapped in.
      context: mergeContext(draft.brief, userContext),
      status: "writing",
      version,
      error: undefined,
    })

    const workflowId = await start(
      ctx,
      internal.workflows.writeContentWorkflow,
      {
        draftId: draft._id,
        version,
        // The change itself has not moved; revise the text against the context.
        revise: true,
      }
    )
    await ctx.db.patch("contentDrafts", draft._id, { workflowId })

    return null
  },
})

/** Manual edit of one piece — kept until the next rewrite overwrites it. */
export const updatePiece = mutation({
  args: { pieceId: v.id("contentPieces"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerToken = await requireOwnerToken(ctx)
    const piece = await ctx.db.get("contentPieces", args.pieceId)
    if (!piece || piece.ownerToken !== ownerToken)
      throw new Error("Draft not found")

    await ctx.db.patch("contentPieces", piece._id, {
      body: args.body,
      editedByUser: true,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const deleteDraft = mutation({
  args: { draftId: v.id("contentDrafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await requireOwnedDraft(ctx, args.draftId)
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_draft", (q) => q.eq("draft", draft._id))
      .take(20)

    for (const piece of pieces) await ctx.db.delete("contentPieces", piece._id)
    await ctx.db.delete("contentDrafts", draft._id)

    return null
  },
})

/* -------------------------------------------------------------------------- */
/* Internal surface used by the generation workflow                            */
/* -------------------------------------------------------------------------- */

export const getDraftInternal = internalQuery({
  args: { draftId: v.id("contentDrafts") },
  returns: v.union(schema.doc("contentDrafts"), v.null()),
  handler: async (ctx, args) => await ctx.db.get("contentDrafts", args.draftId),
})

/** Everything the model needs to describe the change, without the diffs. */
export const getDraftSources = internalQuery({
  args: { draftId: v.id("contentDrafts") },
  returns: v.union(
    v.object({
      repo: schema.doc("watchedRepos"),
      draft: schema.doc("contentDrafts"),
      subject: v.union(schema.doc("repoEvents"), v.null()),
      events: v.array(schema.doc("repoEvents")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("contentDrafts", args.draftId)
    if (!draft) return null

    const repo = await ctx.db.get("watchedRepos", draft.repo)
    if (!repo) return null

    const events: Doc<"repoEvents">[] = []
    for (const eventId of draft.sourceEvents) {
      const event = await ctx.db.get("repoEvents", eventId)
      if (event) events.push(event)
    }

    const subject = draft.sourceEvent
      ? await ctx.db.get("repoEvents", draft.sourceEvent)
      : null

    return { repo, draft, subject, events }
  },
})

/**
 * The single string every writing pass reads. Always contains the scan's brief;
 * the author's own note is appended under its own heading so the model can tell
 * verified facts from author intent.
 */
export function mergeContext(
  brief: string | undefined,
  userContext: string | undefined,
): string {
  const sections: string[] = []
  if (brief) sections.push(`WHAT THIS CHANGE IS (verified against the diff):\n${brief}`)
  if (userContext)
    sections.push(`AUTHOR'S OWN CONTEXT (intent and framing — trust it):\n${userContext}`)

  return sections.join("\n\n")
}

/** Previous bodies, keyed by channel, so a rewrite can revise instead of restart. */
export const getPieceBodies = internalQuery({
  args: { draftId: v.id("contentDrafts") },
  returns: v.record(v.string(), v.string()),
  handler: async (ctx, args) => {
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_draft", (q) => q.eq("draft", args.draftId))
      .take(20)

    const bodies: Record<string, string> = {}
    for (const piece of pieces) bodies[piece.channel] = piece.body

    return bodies
  },
})

export const setDraftStatus = internalMutation({
  args: {
    draftId: v.id("contentDrafts"),
    status: schema.doc("contentDrafts").fields.status,
    version: v.number(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("contentDrafts", args.draftId)
    // A late write from a superseded run must not clobber the current one.
    if (!draft || draft.version !== args.version) return null

    await ctx.db.patch("contentDrafts", draft._id, {
      status: args.status,
      error: args.error,
      generatedAt: args.status === "ready" ? Date.now() : draft.generatedAt,
    })

    return null
  },
})

export const saveSourceDigest = internalMutation({
  args: {
    draftId: v.id("contentDrafts"),
    version: v.number(),
    sourceDigest: v.string(),
    repoProfile: v.optional(v.string()),
    headline: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("contentDrafts", args.draftId)
    if (!draft || draft.version !== args.version) return null

    await ctx.db.patch("contentDrafts", draft._id, {
      sourceDigest: args.sourceDigest,
      repoProfile: args.repoProfile ?? draft.repoProfile,
      headline: args.headline ?? draft.headline,
    })

    return null
  },
})

/** The scan's understanding of the change; also refreshes the merged context. */
export const saveBrief = internalMutation({
  args: {
    draftId: v.id("contentDrafts"),
    version: v.number(),
    brief: v.string(),
    headline: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("contentDrafts", args.draftId)
    if (!draft || draft.version !== args.version) return null

    await ctx.db.patch("contentDrafts", draft._id, {
      brief: args.brief,
      context: mergeContext(args.brief, draft.userContext),
      headline: args.headline ?? draft.headline,
    })

    return null
  },
})

export const saveResearch = internalMutation({
  args: {
    draftId: v.id("contentDrafts"),
    version: v.number(),
    research: v.string(),
    sources: v.array(v.string()),
    model: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("contentDrafts", args.draftId)
    if (!draft || draft.version !== args.version) return null

    await ctx.db.patch("contentDrafts", draft._id, {
      research: args.research,
      researchSources: args.sources,
      model: args.model,
    })

    return null
  },
})

export const savePiece = internalMutation({
  args: {
    draftId: v.id("contentDrafts"),
    version: v.number(),
    channel,
    body: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("contentDrafts", args.draftId)
    if (!draft || draft.version !== args.version) return null

    const existing = await ctx.db
      .query("contentPieces")
      .withIndex("by_draft_and_channel", (q) =>
        q.eq("draft", draft._id).eq("channel", args.channel)
      )
      .unique()

    if (existing) {
      await ctx.db.patch("contentPieces", existing._id, {
        body: args.body,
        editedByUser: false,
        version: args.version,
        updatedAt: Date.now(),
      })
      return null
    }

    await ctx.db.insert("contentPieces", {
      draft: draft._id,
      ownerToken: draft.ownerToken,
      channel: args.channel,
      body: args.body,
      editedByUser: false,
      version: args.version,
      updatedAt: Date.now(),
    })

    return null
  },
})
