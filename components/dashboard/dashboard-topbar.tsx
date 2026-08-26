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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4">
      <SidebarTrigger className="text-ink-500" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="text-ink-500">
              Northwind
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-ink-900">
              Overview
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative ml-auto hidden w-full max-w-[320px] md:block">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-300" />
        <input
          aria-label="Search recordings"
          placeholder="Search across every call…"
          className="w-full rounded-full border border-line bg-surface py-[9px] pr-4 pl-10 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500"
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
