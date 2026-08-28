import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const brightBadgeVariants = cva(
  "inline-flex items-center rounded-full px-[11px] py-[5px] text-xs font-bold",
  {
    variants: {
      tone: {
        accent: "bg-accent-100 text-accent-500",
        positive: "bg-positive-tint text-positive",
        attention: "bg-attention-tint text-attention-ink",
        neutral: "border border-line bg-surface font-semibold text-ink-500",
        inverse: "bg-ink-900 text-canvas",
      },
    },
    defaultVariants: { tone: "accent" },
  }
)

function BrightBadge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof brightBadgeVariants>) {
  return (
    <span
      data-slot="bright-badge"
      className={cn(brightBadgeVariants({ tone }), className)}
      {...props}
    />
  )
}

/** Mono, uppercase, letter-spaced label that sits above a headline. */
function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="bright-eyebrow"
      className={cn(
        "font-mono text-[11px] tracking-[0.12em] text-accent-500 uppercase",
        className
      )}
      {...props}
    />
  )
}

/** Same treatment as Eyebrow, muted — used to label spec blocks. */
function SpecLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="bright-spec-label"
      className={cn(
        "font-mono text-[11px] tracking-[0.1em] text-ink-500 uppercase",
        className
      )}
      {...props}
    />
  )
}

export { BrightBadge, brightBadgeVariants, Eyebrow, SpecLabel }
