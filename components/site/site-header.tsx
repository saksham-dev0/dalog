"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

import { BrightButton } from "@/components/bright/button"
import { Logo } from "@/components/bright/logo"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/design-system" },
]

function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-5 px-6 py-4">
        <div className="flex items-center gap-[26px]">
          <Logo size="md" />
          <nav className="hidden gap-1.5 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-[7px] text-sm font-semibold no-underline hover:no-underline",
                  pathname === link.href
                    ? "bg-sunken text-ink-900"
                    : "text-ink-500 hover:bg-sunken hover:text-ink-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-[10px]">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <BrightButton
                variant="ghost"
                size="sm"
                className="px-3 py-[9px] text-sm"
              >
                Log in
              </BrightButton>
            </SignInButton>
            <SignUpButton mode="modal">
              <BrightButton size="sm" className="px-[18px] py-[9px] text-sm">
                Start free
              </BrightButton>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="no-underline hover:no-underline">
              <BrightButton
                variant="ghost"
                size="sm"
                className="px-3 py-[9px] text-sm"
              >
                Dashboard
              </BrightButton>
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
