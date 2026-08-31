"use client"

import Link from "next/link"
import { Loader2, Sparkles, TriangleAlert } from "lucide-react"
import { useQuery } from "convex/react"

import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { Surface } from "@/components/bright/card"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"

const STATUS_COPY: Record<
  Doc<"contentDrafts">["status"],
  { label: string; tone: "accent" | "positive" | "attention" | "neutral" }
> = {
  pending: { label: "Queued", tone: "neutral" },
  reading: { label: "Reading the diff", tone: "accent" },
  researching: { label: "Researching formats", tone: "accent" },
  scanned: { label: "Scanned", tone: "neutral" },
  writing: { label: "Writing", tone: "accent" },
  ready: { label: "Ready", tone: "positive" },
  error: { label: "Failed", tone: "attention" },
}

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

/** Live list of drafting runs — a row flips to Ready as the workflow lands. */
function DraftList() {
  const drafts = useQuery(api.content.listDrafts)

  if (drafts === undefined) {
    return (
      <Surface
        elevation="none"
        className="flex items-center justify-center border-dashed p-10 text-[15px] text-ink-300"
      >
        Loading drafts…
      </Surface>
    )
  }

  if (drafts.length === 0) {
    return (
      <Surface
        elevation="none"
        className="flex flex-col items-center gap-3 border-dashed p-10 text-center"
      >
        <BrightBadge tone="neutral">Nothing drafted yet</BrightBadge>
        <p className="max-w-[440px] text-[15px] leading-[1.6] text-ink-500">
          Click any commit, PR, merge or branch on the Activity page. The AI
          scans it in the background, then you generate the posts.
        </p>
      </Surface>
    )
  }

  return (
    <Surface elevation="none" className="overflow-hidden">
      {drafts.map((draft, i) => {
        const { label, tone } = STATUS_COPY[draft.status]
        const busy = draft.status !== "ready" && draft.status !== "error"

        return (
          <Link
            key={draft._id}
            href={`/dashboard/content/${draft._id}`}
            className={`flex items-center gap-4 px-[22px] py-[18px] no-underline hover:bg-hover hover:no-underline ${
              i === drafts.length - 1 ? "" : "border-b border-sunken"
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-ink-500">
              {busy ? (
                <Loader2 className="size-[16px] animate-spin" />
              ) : draft.status === "error" ? (
                <TriangleAlert className="size-[16px]" />
              ) : (
                <Sparkles className="size-[16px]" />
              )}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <SpecLabel>{draft.fullName}</SpecLabel>
              <span className="truncate text-[15px] font-semibold text-ink-900">
                {draft.headline}
              </span>
              <span className="text-[13px] text-ink-300">
                {draft.sourceEventCount} events
                {draft.version > 1 ? ` · revision ${draft.version}` : ""}
                {draft.hasUserContext ? " · has your context" : ""}
              </span>
            </div>

            <BrightBadge tone={tone} className="shrink-0">
              {label}
            </BrightBadge>
            <span className="w-[70px] shrink-0 text-right text-[13px] text-ink-300">
              {formatWhen(draft.generatedAt ?? draft._creationTime)}
            </span>
          </Link>
        )
      })}
    </Surface>
  )
}

export { DraftList }
