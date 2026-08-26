import * as React from "react"

import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { cn } from "@/lib/utils"

const links = [
  { label: "Product", href: "#components", active: true },
  { label: "Pricing", href: "#components", active: false },
  { label: "Docs", href: "#components", active: false },
]

function BrightNavBar() {
  return (
    <Surface className="flex flex-wrap items-center justify-between gap-5 p-5">
      <div className="flex items-center gap-[26px]">
        <div className="flex items-center gap-[9px]">
          <div className="size-[22px] rounded-[7px] bg-accent-500" />
          <span className="text-[15px] font-extrabold tracking-[-0.02em]">
            Bright
          </span>
        </div>
        <div className="flex gap-1.5">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-[7px] text-sm font-semibold no-underline hover:no-underline",
                link.active
                  ? "bg-sunken text-ink-900"
                  : "text-ink-500 hover:bg-canvas hover:text-ink-900"
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <BrightButton variant="ghost" size="sm" className="px-3 py-[9px] text-sm">
          Log in
        </BrightButton>
        <BrightButton size="sm" className="px-[18px] py-[9px] text-sm">
          Start free
        </BrightButton>
      </div>
    </Surface>
  )
}

export { BrightNavBar }
