"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type SegmentedTab = { label: string; title: string; body: string }

function SegmentedTabs({ tabs }: { tabs: SegmentedTab[] }) {
  const [active, setActive] = React.useState(0)

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        role="tablist"
        className="flex gap-1 rounded-full bg-sunken p-1"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-bold transition-colors",
              active === i
                ? "bg-surface text-ink-900 shadow-[0_1px_2px_rgba(16,16,19,0.08)]"
                : "text-ink-500 hover:text-ink-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex w-full max-w-[520px] flex-col gap-[10px] text-center">
        <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">
          {tabs[active].title}
        </h3>
        <p className="text-[15px] leading-[1.6] text-ink-500">
          {tabs[active].body}
        </p>
      </div>
    </div>
  )
}

export { SegmentedTabs }
