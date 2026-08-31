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

/**
 * The scan's big text artifacts. They live in their own table because the
 * draft row is read by the drafts list and rewritten on every status change,
 * and these seven fields are ~40KB of the ~41KB draft — reading and rewriting
 * them on each of those was the bulk of the deployment's database bandwidth.
 *
 * Declared once so `draftArtifacts` and the legacy columns on `contentDrafts`
 * cannot drift while the backfill is in flight.
 */
export const draftArtifactFields = {
  /** The scan's grounded understanding of the change, on its own. */
  brief: v.optional(v.string()),
  /**
   * The working context every writing pass reads: the model's own brief on
   * the change, merged with whatever the author added.
   */
  context: v.optional(v.string()),
  /** Raw free-text the author added, kept separately so merges stay idempotent. */
  userContext: v.optional(v.string()),
  /** Commits, PRs and diff excerpts the model was given. */
  sourceDigest: v.optional(v.string()),
  /** Snapshot of the repo profile this draft was scanned against. */
  repoProfile: v.optional(v.string()),
  /** What the grounded research pass found about format and virality. */
  research: v.optional(v.string()),
  researchSources: v.optional(v.array(v.string())),
}

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
    /**
     * LEGACY — the codebase profile now lives in `repoProfiles`. Kept optional
     * only so the backfill can read it; drop both fields once
     * `migrations.backfillRepoProfiles` reports 0 remaining.
     */
    repoProfile: v.optional(v.string()),
    profiledAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerToken"])
    .index("by_owner_and_fullName", ["ownerToken", "fullName"])
    .index("by_githubRepoId", ["githubRepoId"])
    // The stalled-watch cron, which otherwise scans every repo of every user
    // every 15 minutes to usually act on nothing. `lastSyncedAt` is optional
    // and undefined sorts before every number, so a watching repo that has
    // never synced is correctly inside the "stalled" range.
    .index("by_status_and_lastSyncedAt", ["status", "lastSyncedAt"]),

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
    .index("by_repo_and_occurredAt", ["repo", "occurredAt"])
    // The activity filters: one kind, across every repo or inside one repo.
    .index("by_owner_kind_and_occurredAt", ["ownerToken", "kind", "occurredAt"])
    .index("by_repo_kind_and_occurredAt", ["repo", "kind", "occurredAt"]),

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
     * Whether the author attached their own context. The drafts list only ever
     * needed the boolean, not the text, so the text stayed in `draftArtifacts`.
     */
    hasUserContext: v.optional(v.boolean()),
    /**
     * LEGACY — these now live in `draftArtifacts`. Kept optional only so the
     * backfill can read them; drop this spread once
     * `migrations.backfillDraftArtifacts` reports 0 remaining.
     */
    ...draftArtifactFields,
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

  /**
   * The rendered profile of a codebase — description, languages, dependencies,
   * directory layout, README excerpt. Split out of `watchedRepos` because that
   * row is patched on every poll and read by `listWatched`, and a full-document
   * read plus rewrite of a 14KB profile every 60 seconds is pure waste.
   */
  repoProfiles: defineTable({
    repo: v.id("watchedRepos"),
    profile: v.string(),
    profiledAt: v.number(),
  }).index("by_repo", ["repo"]),

  /**
   * Per-repo poll bookkeeping, kept off `watchedRepos` so the poller can write
   * it every cycle for a few hundred bytes.
   *
   * `eventsFingerprint` is a SHA-256 over the sorted `externalId`s the last
   * poll derived. Dedupe is purely by `externalId`, so an identical
   * fingerprint means there is provably nothing new to insert — and the poll
   * can skip the ~160 per-event document reads it would otherwise do.
   */
  repoSyncState: defineTable({
    repo: v.id("watchedRepos"),
    eventsFingerprint: v.optional(v.string()),
    /** Exact last poll time; `watchedRepos.lastSyncedAt` is throttled for the UI. */
    polledAt: v.number(),
  }).index("by_repo", ["repo"]),

  /** The scan's heavy text, one row per draft. See `draftArtifactFields`. */
  draftArtifacts: defineTable({
    draft: v.id("contentDrafts"),
    ownerToken: v.string(),
    ...draftArtifactFields,
  }).index("by_draft", ["draft"]),
})
