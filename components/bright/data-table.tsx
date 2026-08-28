import * as React from "react"

import { BrightBadge } from "@/components/bright/badge"
import { Surface } from "@/components/bright/card"
import type { MeetingRow } from "@/components/bright/tokens"

const statusTone = {
  Synced: "positive",
  Processing: "accent",
  "Needs review": "attention",
} as const

const columns = "grid grid-cols-[2fr_1.4fr_1fr_0.8fr] gap-4"

function BrightDataTable({ rows }: { rows: MeetingRow[] }) {
  return (
    <Surface elevation="none" className="overflow-hidden">
      <div
        className={`${columns} border-b border-line bg-canvas px-[22px] py-[14px]`}
      >
        {["Meeting", "Owner", "Status", "Length"].map((head, i) => (
          <span
            key={head}
            className={`font-mono text-[11px] tracking-[0.1em] text-ink-500 uppercase ${
              i === 3 ? "text-right" : ""
            }`}
          >
            {head}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.name}
          className={`${columns} items-center border-b border-sunken px-[22px] py-[15px] hover:bg-hover`}
        >
          <span className="text-sm font-semibold text-ink-900">{row.name}</span>
          <span className="text-sm text-ink-500">{row.owner}</span>
          <BrightBadge
            tone={statusTone[row.status]}
            className="justify-self-start px-[10px] py-1"
          >
            {row.status}
          </BrightBadge>
          <span className="text-right font-mono text-[13px] text-ink-500">
            {row.length}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between px-[22px] py-[14px]">
        <span className="text-[13px] text-ink-300">4 of 128 recordings</span>
        <div className="flex gap-1.5">
          {["Prev", "1", "2", "Next"].map((label) => (
            <button
              key={label}
              className={
                label === "1"
                  ? "cursor-pointer rounded-lg border-none bg-ink-900 px-3 py-1.5 text-[13px] font-bold text-canvas"
                  : "cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-bold text-ink-500 hover:bg-canvas"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Surface>
  )
}

export { BrightDataTable }
