import { v } from "convex/values"
import { WorkflowManager } from "@convex-dev/workflow"

import { components, internal } from "./_generated/api"
import { CHANNELS } from "./content"

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
