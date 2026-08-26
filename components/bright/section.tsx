import * as React from "react"

import { cn } from "@/lib/utils"

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("flex w-full max-w-[1080px] flex-col gap-6", className)}
      {...props}
    />
  )
}

function SectionHeader({
  index,
  title,
  meta,
}: {
  index: string
  title: string
  meta?: string
}) {
  return (
    <div className="flex items-baseline gap-[14px] border-b border-line pb-3">
      <span className="font-mono text-[11px] tracking-[0.1em] text-ink-300 uppercase">
        {index}
      </span>
      <h2 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
        {title}
      </h2>
      {meta ? <span className="text-sm text-ink-500">{meta}</span> : null}
    </div>
  )
}

export { Section, SectionHeader }
