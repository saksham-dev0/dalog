import { httpRouter } from "convex/server"

import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { httpAction } from "./_generated/server"

type EventInput = {
  kind: "commit" | "pull_request" | "merge" | "branch"
  action: string
  title: string
  actor: string
  url: string
  branch?: string
  sha?: string
  number?: number
  occurredAt: number
  externalId: string
}

/** Constant-time compare of the two hex digests. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)

  return diff === 0
}

async function signatureMatches(
  secret: string,
  body: string,
  header: string | null
): Promise<boolean> {
  if (!header?.startsWith("sha256=")) return false

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  )
  const digest = Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return safeEqual(`sha256=${digest}`, header)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function branchFromRef(ref: string | undefined): string | undefined {
  return ref?.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : ref
}

/** Maps one delivery to the events we store. Unknown types map to nothing. */
function toEvents(
  eventName: string,
  payload: Record<string, unknown>,
  repoUrl: string
): EventInput[] {
  const sender = asRecord(payload.sender)
  const actor = asString(sender?.login) ?? "unknown"
  const events: EventInput[] = []

  if (eventName === "push") {
    const branch = branchFromRef(asString(payload.ref))
    const commits = Array.isArray(payload.commits) ? payload.commits : []

    for (const raw of commits) {
      const commit = asRecord(raw)
      const sha = asString(commit?.id)
      if (!sha) continue

      const author = asRecord(commit?.author)
      const timestamp = asString(commit?.timestamp)
      events.push({
        kind: "commit",
        action: "pushed",
        title: (asString(commit?.message) ?? sha).split("\n")[0],
        actor: asString(author?.username) ?? asString(author?.name) ?? actor,
        url: asString(commit?.url) ?? repoUrl,
        branch,
        sha,
        occurredAt: timestamp ? Date.parse(timestamp) : Date.now(),
        externalId: `commit:${sha}`,
      })
    }

    return events
  }

  if (eventName === "pull_request") {
    const pull = asRecord(payload.pull_request)
    const number = typeof pull?.number === "number" ? pull.number : undefined
    if (!pull || number === undefined) return events

    const merged = pull.merged === true
    const action = asString(payload.action) ?? "updated"
    const state = merged
      ? "merged"
      : action === "closed"
        ? "closed"
        : action === "opened" || action === "reopened"
          ? "opened"
          : action
    const head = asRecord(pull.head)
    const mergedAt = asString(pull.merged_at)
    const createdAt = asString(pull.created_at)

    events.push({
      kind: merged ? "merge" : "pull_request",
      action: state,
      title: asString(pull.title) ?? `#${number}`,
      actor,
      url: asString(pull.html_url) ?? repoUrl,
      branch: asString(head?.ref),
      number,
      occurredAt: merged
        ? mergedAt
          ? Date.parse(mergedAt)
          : Date.now()
        : state === "opened" && createdAt
          ? Date.parse(createdAt)
          : Date.now(),
      externalId: `pr:${number}:${state}`,
    })

    return events
  }

  if (eventName === "create" || eventName === "delete") {
    if (asString(payload.ref_type) !== "branch") return events
    const branch = asString(payload.ref)
    if (!branch) return events

    events.push({
      kind: "branch",
      action: eventName === "create" ? "created" : "deleted",
      title: branch,
      actor,
      url: `${repoUrl}/tree/${branch}`,
      branch,
      occurredAt: Date.now(),
      // A delete is its own event; a re-created branch records again.
      externalId:
        eventName === "create"
          ? `branch:${branch}`
          : `branch:${branch}:deleted:${Date.now()}`,
    })
  }

  return events
}

const http = httpRouter()

http.route({
  path: "/github/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const eventName = request.headers.get("x-github-event")
    const signature = request.headers.get("x-hub-signature-256")
    const body = await request.text()
    if (!eventName) return new Response("Missing event header", { status: 400 })

    const payload = asRecord(JSON.parse(body) as unknown)
    const repository = asRecord(payload?.repository)
    const githubRepoId =
      typeof repository?.id === "number" ? repository.id : null
    if (!payload || githubRepoId === null) {
      return new Response("Unrecognized payload", { status: 400 })
    }

    // One GitHub repo can be watched by several users; each has its own secret.
    const repos = await ctx.runQuery(internal.repos.findByGithubRepoId, {
      githubRepoId,
    })
    const repoUrl = asString(repository?.html_url) ?? ""
    const events = toEvents(eventName, payload, repoUrl)

    let delivered = 0
    for (const repo of repos) {
      if (!repo.webhookSecret) continue
      if (!(await signatureMatches(repo.webhookSecret, body, signature))) {
        continue
      }

      delivered += 1
      if (events.length === 0) continue

      await ctx.runMutation(internal.repos.recordEvents, {
        repoId: repo._id as Id<"watchedRepos">,
        source: "webhook",
        events,
      })
    }

    // Nothing verified means the delivery is not ours (or the secret rotated).
    return delivered > 0
      ? new Response(null, { status: 202 })
      : new Response("Signature mismatch", { status: 401 })
  }),
})

export default http
