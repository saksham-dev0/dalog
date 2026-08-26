import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

const sizes = {
  sm: { mark: "size-5 rounded-md", text: "text-sm" },
  md: { mark: "size-[22px] rounded-[7px]", text: "text-[15px]" },
  lg: { mark: "size-[26px] rounded-lg", text: "text-[17px]" },
}

function Logo({
  size = "md",
  href = "/",
  className,
}: {
  size?: keyof typeof sizes
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-[9px] no-underline hover:no-underline",
        className
      )}
    >
      <span className={cn("bg-accent-500", sizes[size].mark)} />
      <span
        className={cn(
          "font-extrabold tracking-[-0.02em] text-ink-900",
          sizes[size].text
        )}
      >
        Bright
      </span>
    </Link>
  )
}

export { Logo }
