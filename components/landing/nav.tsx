"use client"

import * as React from "react"
import Link from "next/link"

import { ActionButton } from "@/components/landing/primitives"

const links = [
  { label: "Features", href: "#meeting-notes" },
  { label: "Pricing", href: "#how-it-works" },
]

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[960px] items-center justify-between gap-6 px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="no-underline hover:no-underline">
            <span className="flex size-[26px] items-center justify-center rounded-[8px] bg-ink-900 text-[13px] font-black text-white">
              ⏻
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-ink-900 no-underline hover:text-ink-500 hover:no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth?mode=signin"
            className="text-sm font-semibold text-ink-900 no-underline hover:text-ink-500 hover:no-underline"
          >
            Login
          </Link>
          <ActionButton href="/auth?mode=signup" className="py-[7px] text-sm">
            Get started
          </ActionButton>
        </div>
      </div>
    </header>
  )
}

export { LandingNav }
