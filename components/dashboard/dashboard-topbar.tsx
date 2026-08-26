"use client"

import * as React from "react"
import { Bell, Search } from "lucide-react"

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

function DashboardTopbar() {
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
              Northwind
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-ink-300" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-ink-900">
              Overview
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Pill input, sunken fill, 15px body — matches the email-capture spec */}
      <div className="relative ml-auto hidden w-full max-w-[320px] md:block">
        <Search className="absolute top-1/2 left-[18px] size-4 -translate-y-1/2 text-ink-300" />
        <input
          aria-label="Search recordings"
          placeholder="Search across every call…"
          className="w-full rounded-full border border-line bg-canvas py-[9px] pr-[18px] pl-11 text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500 focus:bg-surface"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button
          aria-label="Notifications"
          className="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-sunken hover:text-ink-900"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-[6px] rounded-full bg-accent-500" />
        </button>
        <BrightButton size="sm" className="px-[18px] py-[9px] text-sm">
          New recording
        </BrightButton>
      </div>
    </header>
  )
}

export { DashboardTopbar }
