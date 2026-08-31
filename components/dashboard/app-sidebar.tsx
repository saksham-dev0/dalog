"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Rss, Settings, Sparkles, Terminal } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

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
import { useQuery } from "convex/react"

import { GithubMark } from "@/components/dashboard/github-mark"
import { api } from "@/convex/_generated/api"

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
  { label: "Drafts", href: "/dashboard/drafts", icon: Sparkles },
  { label: "Repos", href: "/dashboard/repos", icon: GithubMark },
]

const accountNav: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

/** Connection comes from the layout; the watch count is a live Convex query. */
function AppSidebar({ githubConnected }: { githubConnected: boolean }) {
  const pathname = usePathname()
  const watchedCount = useQuery(api.repos.countWatched) ?? 0

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
                    {githubConnected
                      ? `${watchedCount} ${watchedCount === 1 ? "repo" : "repos"} watched`
                      : "GitHub not connected"}
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
        {/* Connection prompt lives here so it is visible from any page. */}
        {githubConnected ? null : (
          <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-canvas p-4 group-data-[collapsible=icon]:hidden">
            <span className="text-[13px] leading-[1.5] text-ink-500">
              Connect GitHub to start drafting from your pushes.
            </span>
            <Link
              href="/dashboard/repos"
              className="text-[13px] font-bold text-accent-500 no-underline hover:no-underline"
            >
              Connect GitHub →
            </Link>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            {/* Clerk account switcher. Handles profile, adding/switching
                accounts (multi-session), and sign out. */}
            <div className="flex items-center rounded-[10px] p-1 group-data-[collapsible=icon]:justify-center">
              <UserButton
                showName
                afterSwitchSessionUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "w-full group-data-[collapsible=icon]:w-auto",
                    userButtonTrigger:
                      "w-full justify-start gap-2 rounded-[10px] px-2 py-1.5 hover:bg-sunken group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-0",
                    userButtonOuterIdentifier:
                      "text-[13px] font-bold text-ink-900 truncate group-data-[collapsible=icon]:hidden",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Settings"
                    href="/dashboard/settings"
                    labelIcon={<Settings className="size-4" />}
                  />
                  <UserButton.Link
                    label="Manage repos"
                    href="/dashboard/repos"
                    labelIcon={<GithubMark className="size-4" />}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Drag-edge toggle. */}
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }
