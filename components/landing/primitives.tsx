import * as React from "react"
import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/* Reference-matched action button: 10px radius, sky blue, 15px bold. */
const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] px-[18px] py-[10px] text-[15px] font-semibold transition-colors"

const buttonTones = {
  primary: "bg-sky-500 text-white hover:bg-sky-600",
  outline:
    "border border-line bg-surface text-ink-900 shadow-e1 hover:bg-page",
} as const

function ActionButton({
  href,
  tone = "primary",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  href?: string
  tone?: keyof typeof buttonTones
}) {
  const classes = cn(buttonBase, buttonTones[tone], className)

  if (href) {
    return (
      <Link href={href} className={cn(classes, "no-underline hover:no-underline")}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

/* Centered content column — the reference keeps everything in ~960px. */
function Wrap({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-[960px] px-6", className)} {...props} />
  )
}

const eyebrowTones = {
  green: "text-eyebrow-green",
  blue: "text-sky-500",
  purple: "text-eyebrow-purple",
  orange: "text-eyebrow-orange",
} as const

function SectionEyebrow({
  tone = "blue",
  children,
}: {
  tone?: keyof typeof eyebrowTones
  children: React.ReactNode
}) {
  return (
    <span className={cn("text-sm font-bold", eyebrowTones[tone])}>{children}</span>
  )
}

/* Section headline — 40px, heavy, tight, matching the capture. */
function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em] text-ink-900",
        className
      )}
      {...props}
    />
  )
}

/* Bold run-in heading used for the sub-blocks inside a section. */
function SubHeading({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "text-[17px] leading-[1.35] font-bold tracking-[-0.01em] text-ink-900",
        className
      )}
      {...props}
    />
  )
}

function Body({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[15px] leading-[1.65] text-ink-700", className)}
      {...props}
    />
  )
}

function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-center text-xs text-ink-300", className)} {...props} />
  )
}

function CheckItem({
  children,
  filled = false,
}: {
  children: React.ReactNode
  filled?: boolean
}) {
  return (
    <li className="flex items-start gap-[10px]">
      {filled ? (
        <span className="mt-[3px] flex size-[15px] shrink-0 items-center justify-center rounded-full bg-positive-tint">
          <Check className="size-[9px] text-positive" strokeWidth={4} />
        </span>
      ) : (
        <Check className="mt-[3px] size-[13px] shrink-0 text-positive" strokeWidth={3} />
      )}
      <span className="text-[15px] leading-[1.55] text-ink-700">{children}</span>
    </li>
  )
}

/* Stand-in for the product imagery in the reference capture. */
function MediaPlaceholder({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-[12px] border border-line bg-[repeating-linear-gradient(135deg,var(--color-sunken)_0_10px,var(--color-line)_10px_20px)]",
        className
      )}
    >
      <span className="rounded-full border border-line bg-surface px-[14px] py-1.5 font-mono text-[11px] text-ink-500">
        {label}
      </span>
    </div>
  )
}

/* Left-rule pull quote, tinted per section like the reference. */
function RuleQuote({
  tone = "green",
  quote,
  name,
  role,
}: {
  tone?: "green" | "purple"
  quote: string
  name: string
  role: string
}) {
  return (
    <blockquote
      className={cn(
        "flex flex-col gap-2 border-l-[3px] pl-4",
        tone === "green" ? "border-positive" : "border-eyebrow-purple"
      )}
    >
      <p className="text-[15px] leading-[1.6] font-medium text-ink-900">{quote}</p>
      <footer className="text-[13px] text-ink-300">
        <span className="font-semibold text-ink-500">{name}</span> • {role}
      </footer>
    </blockquote>
  )
}

/* The green handwritten margin notes in the capture. */
function Scribble({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-mono text-[13px] italic text-eyebrow-green",
        className
      )}
      {...props}
    />
  )
}

export {
  ActionButton,
  Body,
  Caption,
  CheckItem,
  MediaPlaceholder,
  RuleQuote,
  Scribble,
  SectionEyebrow,
  SectionTitle,
  SubHeading,
  Wrap,
}
