"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

type Channel = Doc<"contentPieces">["channel"]

const CHANNELS: Array<{ id: Channel; label: string; limit?: number }> = [
  { id: "x", label: "X post", limit: 280 },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reddit", label: "Reddit" },
  { id: "blog", label: "Blog" },
  { id: "video", label: "Video script" },
]

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

function StatusPill({ draft }: { draft: Doc<"contentDrafts"> }) {
  const { label, tone } = STATUS_COPY[draft.status]
  const busy = draft.status !== "ready" && draft.status !== "error"

  return (
    <BrightBadge tone={tone} className="gap-[6px] px-[10px] py-1">
      {busy ? (
        <Loader2 className="size-3 animate-spin" />
      ) : draft.status === "error" ? (
        <TriangleAlert className="size-3" />
      ) : (
        <span className="size-[6px] rounded-full bg-positive" />
      )}
      {label}
    </BrightBadge>
  )
}

/** One clamped line, expandable — long text should not own the page. */
function ReadMore({
  children,
  className,
  moreLabel = "Read more",
}: {
  children: React.ReactNode
  className?: string
  moreLabel?: string
}) {
  const [open, setOpen] = React.useState(false)
  // Short text needs no toggle — one line is already the whole thing.
  const needsToggle = typeof children !== "string" || children.length > 90

  if (!needsToggle) {
    return <p className={className}>{children}</p>
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <p
        className={cn(open ? "whitespace-pre-wrap" : "line-clamp-1", className)}
      >
        {children}
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cursor-pointer bg-transparent text-[12px] font-bold text-ink-500 hover:text-accent-500"
      >
        {open ? "Show less" : moreLabel}
      </button>
    </div>
  )
}

/**
 * The drafting workspace for one run: what the model read, what it wrote per
 * channel, and the context box that rewrites everything. Every read is a live
 * Convex query, so pieces appear as the workflow finishes each one.
 */
function DraftWorkspace({ draftId }: { draftId: Id<"contentDrafts"> }) {
  const data = useQuery(api.content.getDraft, { draftId })
  const updatePiece = useMutation(api.content.updatePiece)
  const rewrite = useMutation(api.content.addContextAndRewrite)
  const generate = useMutation(api.content.generatePieces)
  const saveContext = useMutation(api.content.setUserContext)

  const [active, setActive] = React.useState<Channel>("x")
  const [context, setContext] = React.useState("")
  // Keyed by tab + piece version, so a rewrite or a tab switch drops the edit
  // without an effect that would re-render the page twice.
  const [edited, setEdited] = React.useState<{
    key: string
    value: string
  } | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [rewriting, setRewriting] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const scanToast = React.useRef<string | number | null>(null)

  const piece = data?.pieces.find((p) => p.channel === active)
  const editKey = `${active}:${piece?.version ?? 0}`
  const localEdit = edited?.key === editKey ? edited.value : null
  const body = localEdit ?? piece?.body ?? ""
  const meta = CHANNELS.find((c) => c.id === active)!
  const over = meta.limit !== undefined && body.length > meta.limit

  const status = data?.draft.status
  // The scan runs in a workflow, so the page reports it with a live toast
  // rather than blocking on it.
  React.useEffect(() => {
    const scanning =
      status === "pending" || status === "reading" || status === "researching"

    if (scanning) {
      scanToast.current = toast.loading(
        status === "researching"
          ? "Researching what performs on each platform…"
          : "AI is scanning this change in the background…",
        { id: scanToast.current ?? undefined }
      )
      return
    }

    if (scanToast.current !== null) {
      if (status === "error") {
        toast.error("Scan failed", { id: scanToast.current })
      } else {
        toast.success("Scan complete — ready to generate", {
          id: scanToast.current,
        })
      }
      scanToast.current = null
    }
  }, [status])

  if (data === undefined) {
    return (
      <Surface
        elevation="none"
        className="flex items-center justify-center border-dashed p-10 text-[15px] text-ink-300"
      >
        Loading draft…
      </Surface>
    )
  }

  const { draft, subject, events } = data
  const scanning =
    draft.status === "pending" ||
    draft.status === "reading" ||
    draft.status === "researching"
  const writing = draft.status === "writing"
  const busy = scanning || writing
  const hasPieces = data.pieces.length > 0

  const save = async () => {
    if (!piece || localEdit === null || localEdit === piece.body) return
    setSaving(true)
    try {
      await updatePiece({ pieceId: piece._id, body: localEdit })
      toast.success("Draft saved")
    } catch {
      toast.error("Could not save the draft")
    } finally {
      setSaving(false)
    }
  }

  const submitContext = async () => {
    if (!context.trim()) return
    setRewriting(true)
    try {
      if (hasPieces) {
        await rewrite({ draftId: draft._id, context })
        setEdited(null)
        toast.success("Rewriting all five drafts with your context")
      } else {
        await saveContext({ draftId: draft._id, context })
        toast.success("Context saved", {
          description: "It goes into every draft when you generate.",
        })
      }
      setContext("")
    } catch (error) {
      toast.error("Could not save your context", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setRewriting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/drafts"
          className="flex w-fit items-center gap-1.5 text-[13px] font-bold text-ink-500 no-underline hover:text-ink-900 hover:no-underline"
        >
          <ArrowLeft className="size-[14px]" />
          Back to drafts
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <SpecLabel>{draft.fullName}</SpecLabel>
            <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
              {draft.headline}
            </h1>
            <p className="text-[15px] leading-[1.6] text-ink-500">
              {subject
                ? `${subject.kind.replace("_", " ")} · ${subject.actor}`
                : ""}
              {subject?.branch ? ` · ${subject.branch}` : ""}
              {subject?.sha ? ` · ${subject.sha.slice(0, 7)}` : ""}
              {subject?.number ? ` · #${subject.number}` : ""}
              {draft.model ? ` · ${draft.model}` : ""}
            </p>
            {subject ? (
              <a
                href={subject.url}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1 text-[13px] font-bold text-ink-500 no-underline hover:text-accent-500 hover:no-underline"
              >
                <ExternalLink className="size-[13px]" />
                View on GitHub
              </a>
            ) : null}
          </div>
          <StatusPill draft={draft} />
        </div>
        {draft.status === "error" && draft.error ? (
          <p className="text-[13px] text-attention-ink">{draft.error}</p>
        ) : null}
      </div>

      {/* What the model actually read — the diff, then the format research. */}
      <Collapsible defaultOpen={false} className="group/src">
        <Surface elevation="none" className="overflow-hidden">
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 bg-canvas px-[22px] py-[14px] text-left">
            <ChevronRight className="size-4 shrink-0 text-ink-300 transition-transform group-data-[state=open]/src:rotate-90" />
            <span className="text-sm font-semibold text-ink-900">
              What the model read
            </span>
            <span className="ml-auto hidden shrink-0 text-[13px] text-ink-300 sm:block">
              {draft.sourceDigest
                ? `${Math.round(draft.sourceDigest.length / 1000)}k chars of diff`
                : "no diff yet"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-4 border-t border-line px-[22px] py-[18px]">
              <div className="flex flex-col gap-2">
                <SpecLabel>Activity</SpecLabel>
                <ul className="flex list-none flex-col gap-1.5 p-0">
                  {events.slice(0, 12).map((event) => (
                    <li
                      key={event._id}
                      className="font-mono text-[12px] text-ink-500"
                    >
                      [{event.kind}] {event.title}
                    </li>
                  ))}
                </ul>
              </div>

              {draft.brief ? (
                <div className="flex flex-col gap-2">
                  <SpecLabel>The model&apos;s brief</SpecLabel>
                  <p className="text-[13px] leading-[1.6] whitespace-pre-wrap text-ink-500">
                    {draft.brief}
                  </p>
                </div>
              ) : null}

              {draft.sourceDigest ? (
                <div className="flex flex-col gap-2">
                  <SpecLabel>Diff digest</SpecLabel>
                  <pre className="max-h-[320px] overflow-auto rounded-[12px] bg-sunken p-4 font-mono text-[12px] leading-[1.6] text-ink-700">
                    {draft.sourceDigest}
                  </pre>
                </div>
              ) : null}

              {draft.research ? (
                <div className="flex flex-col gap-2">
                  <SpecLabel>Format research</SpecLabel>
                  <p className="text-[13px] leading-[1.6] whitespace-pre-wrap text-ink-500">
                    {draft.research}
                  </p>
                  {draft.researchSources?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {draft.researchSources.slice(0, 8).map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[12px] text-ink-300 hover:text-accent-500"
                        >
                          <ExternalLink className="size-3" />
                          {new URL(url).hostname}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CollapsibleContent>
        </Surface>
      </Collapsible>

      {/* Channel tabs — only once there is something to show. */}
      {hasPieces || writing ? (
        <div className="flex min-w-0 overflow-x-auto">
          <div role="tablist" className="flex gap-1 rounded-full bg-sunken p-1">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                role="tab"
                aria-selected={active === channel.id}
                onClick={() => setActive(channel.id)}
                className={cn(
                  "cursor-pointer rounded-full px-5 py-2 text-sm font-bold whitespace-nowrap transition-colors",
                  active === channel.id
                    ? "bg-surface text-ink-900 shadow-e1"
                    : "text-ink-500 hover:text-ink-900"
                )}
              >
                {channel.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!hasPieces ? (
        <Surface className="flex flex-col items-center gap-4 p-10 text-center">
          {scanning ? (
            <>
              <Loader2 className="size-6 animate-spin text-accent-500" />
              <div className="flex max-w-[420px] flex-col gap-1">
                <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">
                  {STATUS_COPY[draft.status].label}
                </h2>
                <p className="text-[15px] leading-[1.6] text-ink-500">
                  Reading the actual diff and checking what each platform is
                  rewarding right now. You can leave this page — it keeps going.
                </p>
              </div>
            </>
          ) : draft.status === "error" ? (
            <>
              <TriangleAlert className="size-6 text-attention-ink" />
              <p className="max-w-[420px] text-[15px] leading-[1.6] text-ink-500">
                {draft.error ?? "The scan failed."} Open the change again from
                the activity feed to retry.
              </p>
            </>
          ) : (
            <>
              <div className="flex max-w-[440px] flex-col gap-1">
                <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">
                  Context is ready
                </h2>
                <p className="text-[15px] leading-[1.6] text-ink-500">
                  The AI has read this{" "}
                  {subject?.kind.replace("_", " ") ?? "change"}
                  {draft.sourceDigest
                    ? ` (${Math.round(draft.sourceDigest.length / 1000)}k chars of diff)`
                    : ""}{" "}
                  and researched the current formats. Generate when you are
                  ready.
                </p>
              </div>
              <BrightButton
                className="gap-1.5"
                disabled={generating || writing}
                onClick={async () => {
                  setGenerating(true)
                  try {
                    await generate({ draftId: draft._id })
                    toast.success("Writing all five drafts")
                  } catch (error) {
                    toast.error("Could not start writing", {
                      description:
                        error instanceof Error
                          ? error.message
                          : "Please try again.",
                    })
                  } finally {
                    setGenerating(false)
                  }
                }}
              >
                {generating || writing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Generate content
              </BrightButton>
            </>
          )}
        </Surface>
      ) : null}

      {hasPieces || writing ? (
        <Surface className="flex flex-col gap-4 p-[22px]">
          {piece ? (
            <>
              <textarea
                value={body}
                onChange={(event) =>
                  setEdited({ key: editKey, value: event.target.value })
                }
                onBlur={save}
                spellCheck
                className="min-h-[280px] w-full resize-y rounded-[12px] bg-canvas p-4 text-[15px] leading-[1.65] text-ink-900 outline-none focus:ring-2 focus:ring-accent-200"
              />
              <div className="flex flex-wrap items-center gap-3">
                {meta.limit ? (
                  <span
                    className={cn(
                      "font-mono text-[12px]",
                      over ? "text-critical" : "text-ink-300"
                    )}
                  >
                    {body.length}/{meta.limit}
                  </span>
                ) : (
                  <span className="font-mono text-[12px] text-ink-300">
                    {body.length} chars
                  </span>
                )}
                {piece.editedByUser ? (
                  <BrightBadge tone="neutral">Edited by you</BrightBadge>
                ) : null}
                <div className="ml-auto flex items-center gap-2">
                  <BrightButton
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={async () => {
                      await navigator.clipboard.writeText(body)
                      toast.success("Copied")
                    }}
                  >
                    <Copy className="size-[14px]" />
                    Copy
                  </BrightButton>
                  <BrightButton
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    disabled={
                      saving || localEdit === null || localEdit === piece.body
                    }
                    onClick={save}
                  >
                    {saving ? (
                      <Loader2 className="size-[14px] animate-spin" />
                    ) : (
                      <Check className="size-[14px]" />
                    )}
                    Save
                  </BrightButton>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              {busy ? (
                <>
                  <Loader2 className="size-5 animate-spin text-accent-500" />
                  <p className="text-[15px] text-ink-500">
                    {STATUS_COPY[draft.status].label}…
                  </p>
                </>
              ) : (
                <p className="text-[15px] text-ink-500">
                  No {meta.label.toLowerCase()} yet.
                </p>
              )}
            </div>
          )}
        </Surface>
      ) : null}

      {/* Context. Before the first generation it is simply saved; afterwards it
          triggers a rewrite of all five pieces. */}
      {hasPieces || draft.status === "scanned" ? (
        <Surface className="flex flex-col gap-4 p-[22px]">
          <div className="flex flex-col gap-1">
            <SpecLabel>Add context</SpecLabel>
            <ReadMore className="text-[13px] leading-[1.6] text-ink-300">
              What the diff cannot show. Stored with the scan&apos;s brief, so
              every draft is written against both — and all five are rewritten
              when you add to it.
            </ReadMore>
          </div>
          {draft.userContext ? (
            <div className="rounded-[12px] bg-sunken p-3">
              <ReadMore
                className="text-[13px] leading-[1.6] text-ink-500"
                moreLabel="Read full context"
              >
                {draft.userContext}
              </ReadMore>
            </div>
          ) : null}
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="e.g. this replaces the polling loop we shipped last month — lead with the latency win, keep it humble"
            className="min-h-[90px] w-full resize-y rounded-[12px] bg-canvas p-4 text-[15px] leading-[1.6] text-ink-900 outline-none focus:ring-2 focus:ring-accent-200"
          />
          <BrightButton
            size="sm"
            className="gap-1.5 self-end"
            disabled={rewriting || busy || !context.trim()}
            onClick={submitContext}
          >
            {rewriting ? (
              <Loader2 className="size-[14px] animate-spin" />
            ) : (
              <Sparkles className="size-[14px]" />
            )}
            Rewrite with context
          </BrightButton>
        </Surface>
      ) : null}
    </div>
  )
}

export { DraftWorkspace }
