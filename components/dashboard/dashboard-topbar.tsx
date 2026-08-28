"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { ThemeToggle } from "@/components/dashboard/theme-toggle"

import { BrightButton } from "@/components/bright/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/** Second crumb per route. The first crumb is always the workspace. */
function crumbFor(pathname: string) {
  if (pathname.startsWith("/dashboard/repos")) return "Repos"
  if (pathname.startsWith("/dashboard/settings")) return "Settings"
  if (pathname.startsWith("/dashboard/content")) return "Push detail"
  return "Activity"
}

function DashboardTopbar() {
  const pathname = usePathname()
  const crumb = crumbFor(pathname)
  const onContentDetail = pathname.startsWith("/dashboard/content")

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4">
      <SidebarTrigger className="rounded-[10px] text-ink-500 hover:bg-sunken hover:text-ink-900" />
      <Separator orientation="vertical" className="mr-1 h-4 bg-line" />

      {/* Nav-link type from the system: 14px / 600 */}
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList className="text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/dashboard"
              className="font-semibold text-ink-500 hover:text-ink-900"
            >
              dalog
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-ink-300" />
          {onContentDetail ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard"
                  className="font-semibold text-ink-500 hover:text-ink-900"
                >
                  Activity
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-ink-300" />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-ink-900">
              {crumb}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Pill input, sunken fill, 15px body — matches the email-capture spec */}
      <div className="relative ml-auto hidden w-full max-w-[320px] md:block">
        <Search className="absolute top-1/2 left-[18px] size-4 -translate-y-1/2 text-ink-300" />
        <input
          aria-label="Search pushes"
          placeholder="Search pushes and repos…"
          className="w-full rounded-full border border-line bg-canvas py-[9px] pr-[18px] pl-11 text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500 focus:bg-surface"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <ThemeToggle />
        <Link
          href="/dashboard/repos"
          className="no-underline hover:no-underline"
        >
          <BrightButton
            size="sm"
            className="gap-1.5 px-[18px] py-[9px] text-sm"
          >
            <Plus className="size-4" />
            Connect a repo
          </BrightButton>
        </Link>
        <UserButton />
      </div>
    </header>
  )
}

export { DashboardTopbar }
