import { v } from "convex/values"
import { WorkflowManager } from "@convex-dev/workflow"

import { components, internal } from "./_generated/api"

/** Gap between polls. Webhooks cover the instant path; this is the safety net. */
const POLL_INTERVAL_MS = 60_000

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10,
    defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 2_000, base: 2 },
    retryActionsByDefault: true,
  },
})

/**
 * Durable watch loop for one repo: poll, sleep, repeat. It runs a bounded
 * number of cycles and then starts a successor, so a single workflow's journal
 * stays small while the repo keeps being watched indefinitely. Unwatching
 * cancels the workflow, and the `isWatching` check stops the loop either way.
 */
export const syncRepoWorkflow = workflow
  .define({
    args: { repoId: v.id("watchedRepos"), cycles: v.number() },
    returns: v.null(),
  })
  .handler(async (step, args): Promise<null> => {
    for (let cycle = 0; cycle < args.cycles; cycle++) {
      const stillWatching: boolean = await step.runQuery(
        internal.repos.isWatching,
        { repoId: args.repoId }
      )
      if (!stillWatching) return null

      try {
        await step.runAction(
          internal.github.syncRepo,
          { repoId: args.repoId },
          { retry: true }
        )
      } catch (error) {
        // A repo that stays broken (revoked token, deleted repo) leaves the
        // loop; the UI shows the error and the user can re-watch.
        await step.runMutation(internal.repos.markError, {
          repoId: args.repoId,
          message: error instanceof Error ? error.message : "Sync failed",
        })
        return null
      }

      await step.sleep(POLL_INTERVAL_MS)
    }

    await step.runMutation(internal.repos.continueWatching, {
      repoId: args.repoId,
    })

    return null
  })
