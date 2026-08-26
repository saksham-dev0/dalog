"use client"

import * as React from "react"
import { ChevronRight, Copy, GitCommitHorizontal, Sparkles } from "lucide-react"

import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { channels, diffSample, type PushEvent } from "@/lib/mock-data"

function ContentEditor({ push }: { push: PushEvent }) {
  const [activeId, setActiveId] = React.useState(channels[0].id)
  const [drafts, setDrafts] = React.useState(() =>
    Object.fromEntries(channels.map((c) => [c.id, c.draft]))
  )
  const [context, setContext] = React.useState("")

  const active = channels.find((c) => c.id === activeId)!
  const draft = drafts[activeId]
  const over = active.limit !== undefined && draft.length > active.limit

  return (
    <div className="flex flex-col gap-6">
      {/* Commit context — collapsed by default, so you can sanity-check what
          the model actually read without it dominating the page. */}
      <Collapsible defaultOpen={false} className="group/diff">
        <Surface elevation="none" className="overflow-hidden">
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 bg-canvas px-[22px] py-[14px] text-left">
            <ChevronRight className="size-4 shrink-0 text-ink-300 transition-transform group-data-[state=open]/diff:rotate-90" />
            <span className="font-mono text-[11px] tracking-[0.04em] text-ink-500">
              {push.id}
            </span>
            <span className="truncate text-sm font-semibold text-ink-900">
              {push.summary}
            </span>
            <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-[13px] text-ink-300 sm:flex">
              <GitCommitHorizontal className="size-[14px]" />
              {push.commits} commit{push.commits === 1 ? "" : "s"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-4 border-t border-line px-[22px] py-[18px]">
              <div className="flex flex-col gap-2">
                <SpecLabel>Commits</SpecLabel>
                <ul className="flex list-none flex-col gap-1.5 p-0">
                  {[push.summary, ...push.extraCommits].map((message) => (
                    <li
                      key={message}
                      className="font-mono text-[12px] text-ink-500"
                    >
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <SpecLabel>Diff summary</SpecLabel>
                <pre className="overflow-x-auto rounded-[12px] bg-sunken p-4 font-mono text-[12px] leading-[1.6] text-ink-700">
                  {diffSample}
                </pre>
              </div>
            </div>
          </CollapsibleContent>
        </Surface>
      </Collapsible>

      {/* Channel tabs */}
      <div className="flex min-w-0 overflow-x-auto">
        <div role="tablist" className="flex gap-1 rounded-full bg-sunken p-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              role="tab"
              aria-selected={activeId === channel.id}
              onClick={() => setActiveId(channel.id)}
              className={cn(
                "cursor-pointer rounded-full px-5 py-2 text-sm font-bold whitespace-nowrap transition-colors",
                activeId === channel.id
                  ? "bg-surface text-ink-900 shadow-[0_1px_2px_rgba(16,16,19,0.08)]"
                  : "text-ink-500 hover:text-ink-900"
              )}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <Surface className="flex flex-col gap-4 p-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SpecLabel>{active.label}</SpecLabel>
          {/* The one metric that earns its place: X's hard limit. */}
          {active.limit !== undefined ? (
            <BrightBadge
              tone={over ? "attention" : "neutral"}
              className="font-mono"
            >
              {draft.length} / {active.limit}
            </BrightBadge>
          ) : (
            <span className="font-mono text-[11px] text-ink-300">
              {draft.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          )}
        </div>

        <textarea
          value={draft}
          onChange={(e) =>
            setDrafts((prev) => ({ ...prev, [activeId]: e.target.value }))
          }
          rows={14}
          className={cn(
            "w-full resize-y rounded-[14px] border bg-canvas p-4 text-[15px] leading-[1.7] text-ink-900 outline-none focus:bg-surface",
            over
              ? "border-attention focus:border-attention"
              : "border-line focus:border-accent-500"
          )}
        />

        <div className="flex flex-wrap items-center gap-2">
          <BrightButton variant="secondary" size="sm" className="gap-1.5">
            <Copy className="size-[14px]" />
            Copy
          </BrightButton>
          <BrightButton size="sm" className="gap-1.5">
            <Sparkles className="size-[14px]" />
            Regenerate {active.label}
          </BrightButton>
          {over ? (
            <span className="text-[13px] font-semibold text-attention-ink">
              {draft.length - active.limit!} characters over the limit.
            </span>
          ) : null}
        </div>
      </Surface>

      {/* Manual context feeds the next regeneration. */}
      <Surface elevation="none" className="flex flex-col gap-3 p-[26px]">
        <SpecLabel>Your context</SpecLabel>
        <p className="text-[15px] leading-[1.6] text-ink-500">
          The diff shows what changed, not why. Anything you add here is passed
          to every regeneration on this push.
        </p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          placeholder="e.g. this replaces a polling loop that was costing us 40% of the worker budget…"
          className="w-full resize-y rounded-[14px] border border-line bg-canvas p-4 text-[15px] leading-[1.7] text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500 focus:bg-surface"
        />
        <div className="flex flex-wrap items-center gap-3">
          <BrightButton size="sm" className="gap-1.5">
            <Sparkles className="size-[14px]" />
            Regenerate all with context
          </BrightButton>
          <span className="text-[13px] text-ink-300">
            Overwrites every draft you haven&apos;t edited.
          </span>
        </div>
      </Surface>
    </div>
  )
}

export { ContentEditor }
