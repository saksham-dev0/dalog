import { v } from "convex/values"
import {
  WorkflowManager,
  vResultValidator,
  vWorkflowId,
} from "@convex-dev/workflow"

import { components, internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { CHANNELS } from "./content"

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10,
    defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 2_000, base: 2 },
    retryActionsByDefault: true,
  },
})

/**
 * Every workflow is started with this as its `onComplete`. A finished workflow
 * keeps its journal — one row per step — until something deletes it, so
 * without this the component's `workflows` and `steps` tables grow forever and
 * the component's own `loop`/`monitor` mutations eventually exceed their
 * system-operation budget and start timing out.
 */
export const cleanupWorkflow = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await workflow.cleanup(ctx, args.workflowId)

    return null
  },
})

/**
 * One-shot drain for journals created before `cleanupWorkflow` existed. Only
 * touches workflows that already have a `runResult` — a finished run — so a
 * live workflow is never disturbed. Batched, because deleting a journal is
 * itself many system operations; run it repeatedly until it returns 0.
 */
export const purgeFinishedWorkflows = internalMutation({
  args: { batch: v.optional(v.number()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const limit = Math.min(args.batch ?? 20, 50)
    const page = await workflow.list(ctx, {
      order: "asc",
      paginationOpts: { cursor: null, numItems: 200 },
    })

    let purged = 0
    for (const entry of page.page) {
      if (purged >= limit) break
      if (!entry.runResult) continue

      await workflow.cleanup(ctx, entry.workflowId)
      purged++
    }

    return purged
  },
})

/**
 * Recovery for a workflow whose workpool item was lost — the journal still
 * says a step is in progress, but nothing is scheduled to run it, so it hangs
 * forever. `from: 0` discards the stale journal and starts the run over.
 */
export const restartStalledWorkflow = internalMutation({
  args: { workflowId: vWorkflowId },
  returns: v.null(),
  handler: async (ctx, args) => {
    await workflow.restart(ctx, args.workflowId, { from: 0 })

    return null
  },
})

/** Recovery for a duplicate or abandoned workflow: stop it and free its journal. */
export const killWorkflow = internalMutation({
  args: { workflowId: vWorkflowId },
  returns: v.null(),
  handler: async (ctx, args) => {
    await workflow.cancel(ctx, args.workflowId)
    await workflow.cleanup(ctx, args.workflowId)

    return null
  },
})

/**
 * Durable watch loop for one repo: poll, sleep, repeat. It runs a bounded
 * number of cycles and then starts a successor, so a single workflow's journal
 * stays small while the repo keeps being watched indefinitely. Unwatching
 * cancels the workflow, and the `pollPlan` check stops the loop either way.
 */
export const syncRepoWorkflow = workflow
  .define({
    args: { repoId: v.id("watchedRepos"), cycles: v.number() },
    returns: v.null(),
  })
  .handler(async (step, args): Promise<null> => {
    for (let cycle = 0; cycle < args.cycles; cycle++) {
      // One read answers both "should I keep going" and "how long do I sleep":
      // a repo whose webhook works polls as a safety net, not as the transport.
      const plan: {
        watching: boolean
        pollIntervalMs: number
        since?: number
      } = await step.runQuery(internal.repos.pollPlan, { repoId: args.repoId })
      if (!plan.watching) return null

      try {
        await step.runAction(
          internal.github.syncRepo,
          { repoId: args.repoId, since: plan.since },
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

      await step.sleep(plan.pollIntervalMs)
    }

    await step.runMutation(internal.repos.continueWatching, {
      repoId: args.repoId,
    })

    return null
  })

/**
 * Background scan of one commit, PR, merge or branch: pull the real diff, then
 * research what the platforms are rewarding right now. Stops at `scanned` —
 * writing waits for the user to ask for it.
 */
export const scanEventWorkflow = workflow
  .define({
    args: { draftId: v.id("contentDrafts"), version: v.number() },
    returns: v.null(),
  })
  .handler(async (step, args): Promise<null> => {
    const setStatus = async (
      status: "reading" | "researching" | "scanned" | "error",
      error?: string
    ) => {
      await step.runMutation(internal.content.setDraftStatus, {
        draftId: args.draftId,
        version: args.version,
        status,
        error,
      })
    }

    try {
      await setStatus("reading")
      await step.runAction(
        internal.gemini.buildSourceDigest,
        { draftId: args.draftId, version: args.version },
        { retry: true }
      )

      await step.runAction(
        internal.gemini.buildChangeBrief,
        { draftId: args.draftId, version: args.version },
        { retry: true }
      )

      await setStatus("researching")
      await step.runAction(
        internal.gemini.researchFormats,
        { draftId: args.draftId, version: args.version },
        { retry: true }
      )

      await setStatus("scanned")
    } catch (error) {
      await setStatus(
        "error",
        error instanceof Error ? error.message : "Scan failed"
      )
    }

    return null
  })

/**
 * Writes the five pieces from a scan that already landed. `revise: true` means
 * the user added context, so each piece is rewritten from its previous text.
 */
export const writeContentWorkflow = workflow
  .define({
    args: {
      draftId: v.id("contentDrafts"),
      version: v.number(),
      revise: v.optional(v.boolean()),
    },
    returns: v.null(),
  })
  .handler(async (step, args): Promise<null> => {
    const setStatus = async (
      status: "writing" | "ready" | "error",
      error?: string
    ) => {
      await step.runMutation(internal.content.setDraftStatus, {
        draftId: args.draftId,
        version: args.version,
        status,
        error,
      })
    }

    try {
      await setStatus("writing")
      const previous: Record<string, string> = await step.runQuery(
        internal.content.getPieceBodies,
        { draftId: args.draftId }
      )

      await Promise.all(
        CHANNELS.map((channel) =>
          step.runAction(
            internal.gemini.writeChannel,
            {
              draftId: args.draftId,
              version: args.version,
              channel,
              previous: args.revise ? previous[channel] : undefined,
            },
            { retry: true }
          )
        )
      )

      await setStatus("ready")
    } catch (error) {
      await setStatus(
        "error",
        error instanceof Error ? error.message : "Generation failed"
      )
    }

    return null
  })
