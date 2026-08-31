import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"

/**
 * One-time backfills for the two table splits that took the heavy text off the
 * hot documents: `watchedRepos.repoProfile` → `repoProfiles`, and the seven
 * scan fields on `contentDrafts` → `draftArtifacts`.
 *
 * Both are batched, cursor-paged and idempotent. Reads still fall back to the
 * legacy columns until they are dropped, so the app is correct at every point
 * in between; nothing here has to be run before deploying.
 *
 * How to run, per deployment — one call, it schedules itself until both tables
 * are done:
 *
 *   npx convex run migrations:backfillAll '{}'
 *
 * Then, and only then, delete from `convex/schema.ts`:
 *   - `repoProfile` / `profiledAt` on `watchedRepos`
 *   - the `...draftArtifactFields` spread on `contentDrafts`
 * and the legacy fallbacks marked in `repos.getProfile` and
 * `content.loadArtifacts`.
 */

/** Batch size that comfortably fits one transaction for either table. */
const BATCH = 20

/**
 * Both backfills page by cursor rather than re-reading from row 0 each batch,
 * which made a full run O(n²) in the size of the table. Irrelevant at two rows
 * and very much not at two hundred thousand.
 */
const migrationResult = v.object({
  moved: v.number(),
  scanned: v.number(),
  cursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
})

export const backfillRepoProfiles = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: migrationResult,
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("watchedRepos")
      .paginate({ cursor: args.cursor ?? null, numItems: BATCH })

    let moved = 0
    for (const repo of page.page) {
      if (repo.repoProfile === undefined && repo.profiledAt === undefined) {
        continue
      }

      if (repo.repoProfile !== undefined) {
        const existing = await ctx.db
          .query("repoProfiles")
          .withIndex("by_repo", (q) => q.eq("repo", repo._id))
          .unique()

        if (!existing) {
          await ctx.db.insert("repoProfiles", {
            repo: repo._id,
            profile: repo.repoProfile,
            profiledAt: repo.profiledAt ?? repo._creationTime,
          })
        }
      }

      await ctx.db.patch("watchedRepos", repo._id, {
        repoProfile: undefined,
        profiledAt: undefined,
      })
      moved += 1
    }

    return {
      moved,
      scanned: page.page.length,
      cursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

export const backfillDraftArtifacts = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: migrationResult,
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("contentDrafts")
      .paginate({ cursor: args.cursor ?? null, numItems: BATCH })

    let moved = 0
    for (const draft of page.page) {
      const legacy = {
        brief: draft.brief,
        context: draft.context,
        userContext: draft.userContext,
        sourceDigest: draft.sourceDigest,
        repoProfile: draft.repoProfile,
        research: draft.research,
        researchSources: draft.researchSources,
      }
      const hasLegacy = Object.values(legacy).some(
        (value) => value !== undefined
      )
      // `hasUserContext` is derived here too, since the drafts list reads it
      // instead of the text it replaced.
      const needsFlag = draft.hasUserContext === undefined
      if (!hasLegacy && !needsFlag) continue

      if (hasLegacy) {
        const existing = await ctx.db
          .query("draftArtifacts")
          .withIndex("by_draft", (q) => q.eq("draft", draft._id))
          .unique()

        if (existing) {
          // A scan that ran after the deploy already wrote the new row; its
          // values are newer than the legacy columns, so they win.
          await ctx.db.patch("draftArtifacts", existing._id, {
            brief: existing.brief ?? legacy.brief,
            context: existing.context ?? legacy.context,
            userContext: existing.userContext ?? legacy.userContext,
            sourceDigest: existing.sourceDigest ?? legacy.sourceDigest,
            repoProfile: existing.repoProfile ?? legacy.repoProfile,
            research: existing.research ?? legacy.research,
            researchSources: existing.researchSources ?? legacy.researchSources,
          })
        } else {
          await ctx.db.insert("draftArtifacts", {
            draft: draft._id,
            ownerToken: draft.ownerToken,
            ...legacy,
          })
        }
      }

      await ctx.db.patch("contentDrafts", draft._id, {
        hasUserContext: draft.hasUserContext ?? legacy.userContext !== undefined,
        brief: undefined,
        context: undefined,
        userContext: undefined,
        sourceDigest: undefined,
        repoProfile: undefined,
        research: undefined,
        researchSources: undefined,
      })
      moved += 1
    }

    return {
      moved,
      scanned: page.page.length,
      cursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

/**
 * Runs both backfills to completion, one batch per transaction, carrying each
 * table's cursor forward so a full run costs one pass over each table.
 */
export const backfillAll = internalMutation({
  args: {
    repoCursor: v.optional(v.union(v.string(), v.null())),
    draftCursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    type Result = { cursor: string | null; isDone: boolean }

    const repos: Result = await ctx.runMutation(
      internal.migrations.backfillRepoProfiles,
      { cursor: args.repoCursor ?? null }
    )
    const drafts: Result = await ctx.runMutation(
      internal.migrations.backfillDraftArtifacts,
      { cursor: args.draftCursor ?? null }
    )

    if (!repos.isDone || !drafts.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillAll, {
        repoCursor: repos.isDone ? args.repoCursor ?? null : repos.cursor,
        draftCursor: drafts.isDone ? args.draftCursor ?? null : drafts.cursor,
      })
    }

    return null
  },
})
