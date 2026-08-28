import { cronJobs } from "convex/server"
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"

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
    const repos = await ctx.db.query("watchedRepos").take(500)

    for (const repo of repos) {
      if (repo.status !== "watching") continue
      if ((repo.lastSyncedAt ?? 0) > cutoff) continue

      await ctx.runMutation(internal.repos.continueWatching, {
        repoId: repo._id,
      })
    }

    return null
  },
})

const crons = cronJobs()

crons.interval(
  "revive stalled repo watches",
  { minutes: 15 },
  internal.crons.reviveStalledWatches,
  { staleAfterMs: 15 * 60_000 }
)

export default crons
