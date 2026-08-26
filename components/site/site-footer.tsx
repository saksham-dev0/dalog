import * as React from "react"
import Link from "next/link"

import { Logo } from "@/components/bright/logo"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/#product" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Design system", href: "/design-system" },
      { label: "Guidelines", href: "/design-system#components" },
      { label: "Support", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Careers", href: "/#product" },
      { label: "Privacy", href: "/#product" },
      { label: "Terms", href: "/#product" },
    ],
  },
]

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap justify-between gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <Logo size="sm" />
          <span className="text-[13px] text-ink-300">
            Meeting notes on autopilot, 2026
          </span>
        </div>
        <div className="flex flex-wrap gap-14">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-[9px]">
              <span className="font-mono text-[11px] tracking-[0.1em] text-ink-300 uppercase">
                {col.title}
              </span>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-ink-700 no-underline hover:text-accent-500 hover:no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

export { SiteFooter }
