"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsUpDown, LogOut, Rss, Settings, Terminal } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { GithubMark } from "@/components/dashboard/github-mark"
import { WebhookPill } from "@/components/dashboard/status-pill"
import { repos } from "@/lib/mock-data"

/* Design-system nav link: 14px / 600, radius md 10, sunken active + hover. */
const navButtonClass =
  "rounded-[10px] text-sm font-semibold text-ink-500 hover:bg-canvas hover:text-ink-900 data-active:bg-sunken data-active:font-semibold data-active:text-ink-900"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const workNav: NavItem[] = [
  { label: "Activity", href: "/dashboard", icon: Rss, badge: "3" },
  { label: "Repos", href: "/dashboard/repos", icon: GithubMark },
]

const accountNav: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

function AppSidebar() {
  const pathname = usePathname()
  const brokenWebhooks = repos.filter(
    (repo) => repo.webhook === "broken"
  ).length

  // /dashboard only matches exactly; everything else matches its subtree.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="dalog"
              className="rounded-[10px]"
            >
              <Link href="/">
                <span className="flex aspect-square size-8 items-center justify-center rounded-[8px] bg-accent-500 text-white">
                  <Terminal className="size-4" />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[14px] font-extrabold tracking-[-0.02em] text-ink-900">
                    dalog
                  </span>
                  <span className="truncate text-xs text-ink-300">
                    {repos.length} repos connected
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[11px] tracking-[0.1em] text-ink-500 uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={navButtonClass}
                    tooltip={item.label}
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="rounded-full border border-line bg-surface text-xs font-semibold text-ink-500">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="font-mono text-[11px] tracking-[0.1em] text-ink-500 uppercase">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={navButtonClass}
                    tooltip={item.label}
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Connection health lives here so a dead webhook is visible from any page. */}
        {brokenWebhooks > 0 ? (
          <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-canvas p-4 group-data-[collapsible=icon]:hidden">
            <WebhookPill status="broken" />
            <span className="text-[13px] leading-[1.5] text-ink-500">
              {brokenWebhooks} repo stopped delivering pushes.
            </span>
            <Link
              href="/dashboard/repos"
              className="text-[13px] font-bold text-accent-500 no-underline hover:no-underline"
            >
              Reconnect →
            </Link>
          </div>
        ) : null}

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Saksham Sharma"
                  className="rounded-[10px]"
                >
                  <span className="flex aspect-square size-8 items-center justify-center rounded-full bg-accent-100 text-[11px] font-bold text-accent-600">
                    SS
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-[13px] font-bold text-ink-900">
                      Saksham Sharma
                    </span>
                    <span className="truncate text-xs text-ink-300">
                      @saksham-dev0
                    </span>
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                className="w-56 rounded-[10px]"
              >
                <DropdownMenuLabel className="text-xs text-ink-300">
                  Signed in with GitHub
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/repos">
                    <GithubMark className="size-4" /> Manage repos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/auth?mode=signin">
                    <LogOut className="size-4" /> Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Drag-edge toggle. */}
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }
