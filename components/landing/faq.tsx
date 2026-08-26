"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type FaqItem = { q: string; a: string }

function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = React.useState<number>(-1)

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
      {items.map((item, i) => (
        <div key={item.q} className="border-b border-line last:border-b-0">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-[18px] text-left"
          >
            <span className="text-[15px] font-semibold text-ink-900">
              {item.q}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-ink-300 transition-transform duration-200",
                open === i && "rotate-180"
              )}
            />
          </button>
          <div
            className="overflow-hidden transition-[max-height] duration-[220ms] ease-out"
            style={{ maxHeight: open === i ? 220 : 0 }}
          >
            <p className="px-5 pb-[18px] text-[15px] leading-[1.65] text-ink-500">
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export { FaqList }
