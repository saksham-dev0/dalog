import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export const eventKind = v.union(
  v.literal("commit"),
  v.literal("pull_request"),
  v.literal("merge"),
  v.literal("branch")
)

export const channel = v.union(
  v.literal("x"),
  v.literal("linkedin"),
  v.literal("reddit"),
  v.literal("blog"),
  v.literal("video")
)

export const draftStatus = v.union(
  v.literal("pending"),
  v.literal("reading"),
  v.literal("researching"),
  // Scan done: the model has the diff and the format research, and is waiting
  // for the user to ask for the posts.
  v.literal("scanned"),
  v.literal("writing"),
  v.literal("ready"),
  v.literal("error")
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

  /**
   * One drafting run over a slice of repo activity: what the model read, what
   * it learned about the format, and the pieces it wrote. `version` bumps on
   * every regeneration so a stale write from an old run can be dropped.
   */
  contentDrafts: defineTable({
    repo: v.id("watchedRepos"),
    ownerToken: v.string(),
    fullName: v.string(),
    headline: v.string(),
    status: draftStatus,
    /** The one commit, PR, merge or branch this draft is about. */
    sourceEvent: v.optional(v.id("repoEvents")),
    /**
     * The working context every writing pass reads: the model's own brief on
     * the change, merged with whatever the author added. Written by the scan,
     * so it is never empty once a draft is scanned.
     */
    context: v.optional(v.string()),
    /** The scan's grounded understanding of the change, on its own. */
    brief: v.optional(v.string()),
    /** Raw free-text the author added, kept separately so merges stay idempotent. */
    userContext: v.optional(v.string()),
    /** Commits, PRs and diff excerpts the model was given. */
    sourceDigest: v.optional(v.string()),
    /** What the grounded research pass found about format and virality. */
    research: v.optional(v.string()),
    researchSources: v.optional(v.array(v.string())),
    /** Sibling events given as surrounding context. */
    sourceEvents: v.array(v.id("repoEvents")),
    model: v.string(),
    version: v.number(),
    workflowId: v.optional(v.string()),
    error: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerToken"])
    .index("by_repo", ["repo"])
    .index("by_sourceEvent", ["sourceEvent"]),

  /** One row per channel, so an edit to the blog post never rewrites the rest. */
  contentPieces: defineTable({
    draft: v.id("contentDrafts"),
    ownerToken: v.string(),
    channel,
    body: v.string(),
    /** Set when the user edited the text by hand. */
    editedByUser: v.boolean(),
    version: v.number(),
    updatedAt: v.number(),
  })
    .index("by_draft", ["draft"])
    .index("by_draft_and_channel", ["draft", "channel"]),
})
