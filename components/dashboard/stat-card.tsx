import * as React from "react"

import { Surface } from "@/components/bright/card"
import { cn } from "@/lib/utils"

export type Stat = {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "flat"
  meta: string
}

function StatCard({ label, value, delta, trend, meta }: Stat) {
  return (
    <Surface className="flex flex-col gap-3 p-[26px]">
      {/* Eyebrow · H2 · Caption — straight off the type scale */}
      <span className="font-mono text-[11px] tracking-[0.1em] text-ink-500 uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-[10px]">
        <span className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
          {value}
        </span>
        <span
          className={cn(
            "rounded-full px-[10px] py-1 text-xs font-bold",
            trend === "up" && "bg-positive-tint text-positive-ink",
            trend === "down" && "bg-attention-tint text-attention-ink",
            trend === "flat" && "bg-sunken text-ink-500"
          )}
        >
          {delta}
        </span>
      </div>
      <span className="text-[13px] text-ink-300">{meta}</span>
    </Surface>
  )
}

export { StatCard }
