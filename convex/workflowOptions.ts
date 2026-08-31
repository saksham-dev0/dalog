import type { FunctionReference } from "convex/server"
import type { WorkflowId } from "@convex-dev/workflow"

import { internal } from "./_generated/api"

type OnCompleteArgs = {
  workflowId: WorkflowId
  result:
    | { kind: "success"; returnValue: any }
    | { kind: "failed"; error: string }
    | { kind: "canceled" }
  context: any
}

/**
 * Passed to every `start` call so no journal outlives the run that made it.
 * Lives here, explicitly typed, because a module cannot infer a value from the
 * generated `internal` type that the same module contributes to.
 */
export const CLEANUP_ON_COMPLETE: {
  onComplete: FunctionReference<"mutation", "internal", OnCompleteArgs>
  context: Record<string, never>
} = {
  onComplete: internal.workflows.cleanupWorkflow as FunctionReference<
    "mutation",
    "internal",
    OnCompleteArgs
  >,
  context: {},
}
