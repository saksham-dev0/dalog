import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export const eventKind = v.union(
  v.literal("commit"),
  v.literal("pull_request"),
  v.literal("merge"),
  v.literal("branch")
)

export default defineSchema({
  /**
   * One row per repo a user asked dalog to watch. `ownerToken` is the Clerk
   * `tokenIdentifier` (ownership); `clerkUserId` is the Clerk subject, which
   * is what the Clerk API wants when we ask it for the GitHub OAuth token.
   */
  watchedRepos: defineTable({
    ownerToken: v.string(),
    clerkUserId: v.string(),
    fullName: v.string(),
    githubRepoId: v.number(),
    defaultBranch: v.string(),
    isPrivate: v.boolean(),
    htmlUrl: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("watching"),
      v.literal("error")
    ),
    // Webhook = instant. Polling = the workflow loop only, when GitHub refused
    // to hand us a hook (missing admin:repo_hook, or no push access).
    delivery: v.union(v.literal("webhook"), v.literal("polling")),
    webhookId: v.optional(v.number()),
    webhookSecret: v.optional(v.string()),
    workflowId: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    /** Denormalized — Convex has no count operator. */
    eventCount: v.number(),
  })
    .index("by_owner", ["ownerToken"])
    .index("by_owner_and_fullName", ["ownerToken", "fullName"])
    .index("by_githubRepoId", ["githubRepoId"]),

  /**
   * Commits, pull requests, merges and branch changes, from either the webhook
   * or the polling workflow. `externalId` is the dedupe key across both paths.
   */
  repoEvents: defineTable({
    repo: v.id("watchedRepos"),
    ownerToken: v.string(),
    fullName: v.string(),
    kind: eventKind,
    /** opened / closed / merged / pushed / created / deleted … */
    action: v.string(),
    title: v.string(),
    actor: v.string(),
    url: v.string(),
    branch: v.optional(v.string()),
    sha: v.optional(v.string()),
    number: v.optional(v.number()),
    source: v.union(v.literal("webhook"), v.literal("poll")),
    occurredAt: v.number(),
    externalId: v.string(),
  })
    .index("by_repo_and_externalId", ["repo", "externalId"])
    .index("by_owner_and_occurredAt", ["ownerToken", "occurredAt"])
    .index("by_repo_and_occurredAt", ["repo", "occurredAt"]),
})
