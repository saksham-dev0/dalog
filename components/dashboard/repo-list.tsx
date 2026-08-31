"use client"

import * as React from "react"
import {
  Check,
  GitBranch,
  Loader2,
  Lock,
  Plus,
  TriangleAlert,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { toast } from "sonner"

import { BrightBadge } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { GithubMark } from "@/components/dashboard/github-mark"
import { api } from "@/convex/_generated/api"

/** The projection `listWatched` returns, not the stored document. */
type WatchedRepo = FunctionReturnType<typeof api.repos.listWatched>[number]

export type GithubRepoSummary = {
  id: number
  fullName: string
  private: boolean
  defaultBranch: string
  htmlUrl: string
  pushedAt: string | null
}

function formatWhen(timestamp: number | undefined) {
  if (!timestamp) return "never"

  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 90) return "just now"
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })
}

/** Live watch state for one repo: what the workflow is doing right now. */
function WatchStatus({ repo }: { repo: WatchedRepo }) {
  if (repo.status === "error") {
    return (
      <BrightBadge tone="attention" className="gap-[6px] px-[10px] py-1">
        <TriangleAlert className="size-3" />
        {repo.lastError ?? "Sync failed"}
      </BrightBadge>
    )
  }

  if (repo.status === "pending") {
    return (
      <BrightBadge tone="accent" className="gap-[6px] px-[10px] py-1">
        <span className="size-[6px] animate-pulse rounded-full bg-accent-500" />
        Connecting…
      </BrightBadge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <BrightBadge tone="positive" className="gap-[6px] px-[10px] py-1">
        <span className="size-[6px] rounded-full bg-positive" />
        {repo.delivery === "webhook" ? "Live" : "Polling"}
      </BrightBadge>
      <span className="text-[13px] text-ink-300">
        {repo.eventCount} events · synced {formatWhen(repo.lastSyncedAt)}
      </span>
    </div>
  )
}

/**
 * The GitHub repos the OAuth grant covers, joined against the watch rows in
 * Convex. The watch state is a live query, so the workflow's progress and any
 * event it records show up without a refresh.
 */
function RepoList({ repos }: { repos: GithubRepoSummary[] }) {
  const watched = useQuery(api.repos.listWatched)
  const watch = useMutation(api.repos.watch)
  const unwatch = useMutation(api.repos.unwatch)
  const [busy, setBusy] = React.useState<string | null>(null)

  const byFullName = new Map(
    (watched ?? []).map((repo) => [repo.fullName, repo])
  )

  const toggle = async (repo: GithubRepoSummary) => {
    const existing = byFullName.get(repo.fullName)
    setBusy(repo.fullName)

    try {
      if (existing) {
        await unwatch({ repoId: existing._id })
        toast.success(`Stopped watching ${repo.fullName}`)
      } else {
        await watch({
          fullName: repo.fullName,
          githubRepoId: repo.id,
          defaultBranch: repo.defaultBranch,
          isPrivate: repo.private,
          htmlUrl: repo.htmlUrl,
        })
        toast.success(`Watching ${repo.fullName}`, {
          description: "Commits, PRs, merges and branches land as they happen.",
        })
      }
    } catch (error) {
      toast.error("Could not update the watch", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setBusy(null)
    }
  }

  // Watched repos float to the top so the live rows stay in view.
  const sorted = [...repos].sort(
    (a, b) =>
      Number(byFullName.has(b.fullName)) - Number(byFullName.has(a.fullName))
  )

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((repo) => {
        const entry = byFullName.get(repo.fullName)
        const pending = busy === repo.fullName

        return (
          <Surface
            key={repo.id}
            className="flex flex-wrap items-center gap-5 p-[22px]"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-ink-900">
              <GithubMark className="size-[18px]" />
            </span>

            <div className="flex min-w-[220px] flex-1 flex-col gap-[6px]">
              <div className="flex items-center gap-2">
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[15px] font-bold text-ink-900 hover:text-accent-500"
                >
                  {repo.fullName}
                </a>
                {repo.private ? (
                  <span className="flex items-center gap-1 text-ink-300">
                    <Lock className="size-3" />
                    <span className="text-xs">Private</span>
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-300">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="size-[14px]" />
                  <span className="font-mono text-[12px]">
                    {repo.defaultBranch}
                  </span>
                </span>
                {entry ? (
                  <>
                    <span>·</span>
                    <WatchStatus repo={entry} />
                  </>
                ) : null}
              </div>
            </div>

            <BrightButton
              variant={entry ? "secondary" : "primary"}
              size="sm"
              className="gap-1.5"
              disabled={pending || watched === undefined}
              onClick={() => toggle(repo)}
            >
              {pending ? (
                <Loader2 className="size-[14px] animate-spin" />
              ) : entry ? (
                <Check className="size-[14px]" />
              ) : (
                <Plus className="size-[14px]" />
              )}
              {entry ? "Watching" : "Watch"}
            </BrightButton>
          </Surface>
        )
      })}
    </div>
  )
}

export { RepoList }
