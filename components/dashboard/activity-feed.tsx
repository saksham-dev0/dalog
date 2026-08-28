"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  Loader2,
} from "lucide-react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { toast } from "sonner"

import { BrightBadge } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"

const kindMeta = {
  commit: { icon: GitCommitHorizontal, tone: "neutral", label: "Commit" },
  pull_request: { icon: GitPullRequest, tone: "accent", label: "Pull request" },
  merge: { icon: GitMerge, tone: "positive", label: "Merge" },
  branch: { icon: GitBranch, tone: "attention", label: "Branch" },
} as const

function formatWhen(timestamp: number) {
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })
}

function EventRow({
  event,
  last,
  onOpen,
  opening,
}: {
  event: Doc<"repoEvents">
  last: boolean
  onOpen: (event: Doc<"repoEvents">) => void
  opening: boolean
}) {
  const { icon: Icon, tone, label } = kindMeta[event.kind]

  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      disabled={opening}
      className={`flex w-full cursor-pointer items-center gap-4 bg-transparent px-[22px] py-[18px] text-left hover:bg-hover ${
        last ? "" : "border-b border-sunken"
      }`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-ink-500">
        {opening ? (
          <Loader2 className="size-[16px] animate-spin" />
        ) : (
          <Icon className="size-[16px]" />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] tracking-[0.04em] text-ink-500">
            {event.fullName}
          </span>
          {event.branch ? (
            <>
              <span className="text-ink-300">·</span>
              <span className="font-mono text-[11px] text-ink-300">
                {event.branch}
              </span>
            </>
          ) : null}
        </div>
        <span className="truncate text-[15px] font-semibold text-ink-900">
          {event.title}
        </span>
        <div className="flex items-center gap-[6px] text-[13px] text-ink-300">
          <span>{event.actor}</span>
          <span>·</span>
          <span>{event.action}</span>
          {event.number ? <span>· #{event.number}</span> : null}
          {event.sha ? (
            <span className="font-mono text-[12px]">
              · {event.sha.slice(0, 7)}
            </span>
          ) : null}
        </div>
      </div>

      <BrightBadge tone={tone} className="shrink-0">
        {label}
      </BrightBadge>
      <span className="w-[70px] shrink-0 text-right text-[13px] text-ink-300">
        {formatWhen(event.occurredAt)}
      </span>
      <span
        role="link"
        tabIndex={0}
        aria-label="Open on GitHub"
        onClick={(clickEvent) => {
          clickEvent.stopPropagation()
          window.open(event.url, "_blank", "noreferrer")
        }}
        className="shrink-0 text-ink-300 hover:text-accent-500"
      >
        <ExternalLink className="size-[14px]" />
      </span>
    </button>
  )
}

/**
 * Live feed of everything the watchers have recorded. The Convex query is
 * reactive, so webhook deliveries and workflow polls appear as they land.
 */
function ActivityFeed() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.repos.listEvents,
    {},
    { initialNumItems: 25 }
  )
  const openDraft = useMutation(api.content.openEventDraft)
  const router = useRouter()
  const [opening, setOpening] = React.useState<string | null>(null)

  /** Click a row → open (or reuse) its draft and let the scan run in the
   *  background. The content page picks the scan up from there. */
  const open = async (event: Doc<"repoEvents">) => {
    setOpening(event._id)
    const toastId = toast.loading(`Scanning ${event.kind.replace("_", " ")}…`, {
      description: event.title,
    })

    try {
      const draftId = await openDraft({ eventId: event._id })
      toast.success("Scan running in the background", {
        id: toastId,
        description: "Opening the draft — generate once the context lands.",
      })
      router.push(`/dashboard/content/${draftId}`)
    } catch (error) {
      toast.error("Could not open that change", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setOpening(null)
    }
  }

  if (status === "LoadingFirstPage") {
    return (
      <Surface
        elevation="none"
        className="flex items-center justify-center border-dashed p-10 text-[15px] text-ink-300"
      >
        Loading activity…
      </Surface>
    )
  }

  if (results.length === 0) {
    return (
      <Surface
        elevation="none"
        className="flex flex-col items-center gap-3 border-dashed p-10 text-center"
      >
        <BrightBadge tone="neutral">Nothing yet</BrightBadge>
        <p className="max-w-[420px] text-[15px] leading-[1.6] text-ink-500">
          Watch a repo on the Repos page. Its commits, pull requests, merges and
          branches show up here the moment they happen. Click any of them to
          have the AI scan it and draft posts.
        </p>
      </Surface>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Surface elevation="none" className="overflow-hidden">
        {results.map((event, i) => (
          <EventRow
            key={event._id}
            event={event}
            last={i === results.length - 1}
            onOpen={open}
            opening={opening === event._id}
          />
        ))}
      </Surface>

      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <BrightButton
          variant="secondary"
          size="sm"
          className="self-center"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(25)}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more"}
        </BrightButton>
      ) : null}
    </div>
  )
}

export { ActivityFeed }
