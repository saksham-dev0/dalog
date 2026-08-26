import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const brightButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-300 disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-500 text-white shadow-e1 hover:bg-accent-600 active:bg-accent-700",
        secondary:
          "border border-line bg-surface text-ink-900 hover:border-line-strong hover:bg-canvas",
        tint: "bg-accent-100 text-accent-500 hover:bg-accent-200",
        ghost: "bg-transparent text-ink-500 hover:bg-canvas hover:text-ink-900",
        critical: "bg-critical text-white hover:bg-critical-strong",
      },
      size: {
        sm: "px-4 py-[7px] text-[13px]",
        md: "px-[22px] py-[11px] text-[15px]",
        lg: "px-[30px] py-[15px] text-[17px]",
      },
    },
    compoundVariants: [
      { variant: "ghost", size: "md", class: "px-[14px]" },
      { variant: "ghost", size: "sm", class: "px-3" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  }
)

function BrightButton({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof brightButtonVariants>) {
  return (
    <button
      data-slot="bright-button"
      className={cn(brightButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { BrightButton, brightButtonVariants }
