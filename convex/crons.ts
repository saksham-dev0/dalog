import { cronJobs } from "convex/server"
import { v } from "convex/values"
import { start } from "@convex-dev/workflow"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { CYCLES_PER_WORKFLOW } from "./repos"
import { CLEANUP_ON_COMPLETE } from "./workflowOptions"

/**
 * Safety net: a workflow can end for reasons the repo row never hears about
 * (deploy-time cancellation, a bug that killed the loop). This restarts the
 * loop for any watched repo that has gone quiet.
 */
export const reviveStalledWatches = internalMutation({
  args: { staleAfterMs: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.staleAfterMs
    // Indexed: reads the stalled rows only, instead of every repo of every
    // user. `.lt` on the optional `lastSyncedAt` also catches a watching repo
    // that has never synced, which is exactly the case this cron exists for.
    const stalled = await ctx.db
      .query("watchedRepos")
      .withIndex("by_status_and_lastSyncedAt", (q) =>
        q.eq("status", "watching").lt("lastSyncedAt", cutoff)
      )
      .take(100)

    for (const repo of stalled) {
      // Inlined rather than `runMutation(continueWatching)`: that re-read the
      // repo document this loop already holds, once per stalled repo.
      const workflowId = await start(
        ctx,
        internal.workflows.syncRepoWorkflow,
        { repoId: repo._id, cycles: CYCLES_PER_WORKFLOW },
        CLEANUP_ON_COMPLETE
      )
      await ctx.db.patch("watchedRepos", repo._id, { workflowId })
    }

    return null
  },
})

const crons = cronJobs()

crons.interval(
  "revive stalled repo watches",
  { minutes: 15 },
  internal.crons.reviveStalledWatches,
  // Must clear the slowest poll cadence (10 min for webhook repos) plus the
  // 5-minute `lastSyncedAt` throttle, or a healthy repo reads as stalled and
  // the cron starts a second workflow for it every 15 minutes.
  { staleAfterMs: 45 * 60_000 }
)

export default crons
