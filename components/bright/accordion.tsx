"use client"

import * as React from "react"

export type Faq = { q: string; a: string }

function BrightAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = React.useState<number>(0)

  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div key={item.q} className="border-b border-sunken last:border-b-0">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="flex w-full cursor-pointer items-center justify-between gap-4 bg-transparent py-5 text-left"
          >
            <span className="text-base font-bold text-ink-900">{item.q}</span>
            <span className="text-lg font-medium text-ink-300">
              {open === i ? "−" : "+"}
            </span>
          </button>
          <div
            className="overflow-hidden transition-[max-height] duration-[220ms] ease-out"
            style={{ maxHeight: open === i ? 200 : 0 }}
          >
            <p className="max-w-[640px] pb-5 text-[15px] leading-[1.6] text-ink-500">
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export { BrightAccordion }
