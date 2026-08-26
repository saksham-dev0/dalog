import Link from "next/link"
import { ChevronRight, GitCommitHorizontal, RotateCw } from "lucide-react"

import { SpecLabel } from "@/components/bright/badge"
import { Surface } from "@/components/bright/card"
import { GenerationPill } from "@/components/dashboard/status-pill"
import { pushes, pushesThisWeek } from "@/lib/mock-data"

export const metadata = {
  title: "Activity · dalog",
  description: "Every push across your connected repos.",
}

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-7">
      {/* Page header — one counter, nothing else. Engagement metrics need
          posting integrations that don't exist yet. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SpecLabel>Activity</SpecLabel>
          <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
            Everything you shipped
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-500">
            {pushesThisWeek} pushes processed this week.
          </p>
        </div>
      </div>

      {/* Feed */}
      <Surface elevation="none" className="overflow-hidden">
        {pushes.map((push, i) => (
          <Link
            key={push.id}
            href={`/dashboard/content/${push.id}`}
            className={`flex items-center gap-4 px-[22px] py-[18px] no-underline hover:bg-[#FAFAFB] hover:no-underline ${
              i === pushes.length - 1 ? "" : "border-b border-sunken"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] tracking-[0.04em] text-ink-500">
                  {push.repo}
                </span>
                <span className="text-ink-300">·</span>
                <span className="font-mono text-[11px] text-ink-300">
                  {push.branch}
                </span>
              </div>
              <span className="truncate text-[15px] font-semibold text-ink-900">
                {push.summary}
              </span>
              <div className="flex items-center gap-[6px] text-[13px] text-ink-300">
                <GitCommitHorizontal className="size-[14px]" />
                <span>
                  {push.commits} commit{push.commits === 1 ? "" : "s"}
                </span>
                {push.extraCommits.length > 0 ? (
                  <span className="hidden truncate sm:inline">
                    · {push.extraCommits[0]}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              {push.status === "failed" ? (
                <span className="hidden items-center gap-1.5 text-[13px] font-bold text-accent-500 sm:flex">
                  <RotateCw className="size-[14px]" />
                  Retry
                </span>
              ) : null}
              <GenerationPill status={push.status} />
              <span className="hidden w-[70px] text-right font-mono text-[11px] text-ink-300 md:block">
                {push.when}
              </span>
              <ChevronRight className="size-4 text-ink-300" />
            </div>
          </Link>
        ))}
      </Surface>

      <p className="text-[13px] text-ink-300">
        Showing {pushes.length} of {pushes.length} pushes. Older activity is
        trimmed after 90 days.
      </p>
    </div>
  )
}
