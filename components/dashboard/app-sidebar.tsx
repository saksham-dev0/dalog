"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  ChevronsUpDown,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  Sparkles,
  Video,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { BrightButton } from "@/components/bright/button"

/* Design-system nav link: 14px / 600, radius md 10, sunken active + hover. */
const navButtonClass =
  "rounded-[10px] text-sm font-semibold text-ink-500 hover:bg-canvas hover:text-ink-900 data-active:bg-sunken data-active:font-semibold data-active:text-ink-900"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  items?: string[]
}

const platformNav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  {
    label: "Recordings",
    icon: Video,
    badge: "12",
    items: ["All recordings", "Needs review", "Shared with me"],
  },
  { label: "Calendar", icon: CalendarDays },
  {
    label: "Workspaces",
    icon: FolderOpen,
    items: ["Northwind", "Design", "Hiring"],
  },
  { label: "Insights", icon: BarChart3 },
]

const supportNav: NavItem[] = [
  { label: "Settings", icon: Settings },
  { label: "Support", icon: LifeBuoy },
]

function AppSidebar() {
  const { state } = useSidebar()
  const [active, setActive] = React.useState("Overview")
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Bright"
              className="rounded-[10px]"
            >
              <Link href="/">
                <span className="flex aspect-square size-8 items-center justify-center rounded-[8px] bg-accent-500 text-white">
                  <Sparkles className="size-4" />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[14px] font-extrabold tracking-[-0.02em] text-ink-900">
                    Bright
                  </span>
                  <span className="truncate text-xs text-ink-300">
                    Northwind workspace
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
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformNav.map((item) =>
                item.items ? (
                  <Collapsible
                    key={item.label}
                    asChild
                    defaultOpen={false}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={navButtonClass}
                          tooltip={item.label}
                          isActive={active === item.label}
                          onClick={() => setActive(item.label)}
                        >
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.badge ? (
                        <SidebarMenuBadge className="rounded-full border border-line bg-surface text-xs font-semibold text-ink-500">
                        {item.badge}
                      </SidebarMenuBadge>
                      ) : null}
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((sub) => (
                            <SidebarMenuSubItem key={sub}>
                              <SidebarMenuSubButton asChild>
                                <span className="cursor-pointer">{sub}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className={navButtonClass}
                      tooltip={item.label}
                      isActive={active === item.label}
                      onClick={() => setActive(item.label)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge className="rounded-full border border-line bg-surface text-xs font-semibold text-ink-500">
                        {item.badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="font-mono text-[11px] tracking-[0.1em] text-ink-500 uppercase">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={navButtonClass}
                    tooltip={item.label}
                    isActive={active === item.label}
                    onClick={() => setActive(item.label)}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Upgrade card collapses away with the sidebar. */}
        {collapsed ? null : (
          <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-canvas p-4">
            <span className="text-[13px] leading-[1.5] text-ink-500">
              9 days left on the Team trial.
            </span>
            <Link href="/#how-it-works" className="no-underline hover:no-underline">
              <BrightButton size="sm" className="w-full">
                Upgrade
              </BrightButton>
            </Link>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Jane Mercer" className="rounded-[10px]">
                  <span className="flex aspect-square size-8 items-center justify-center rounded-full bg-accent-100 text-[11px] font-bold text-accent-600">
                    JM
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-[13px] font-bold text-ink-900">
                      Jane Mercer
                    </span>
                    <span className="truncate text-xs text-ink-300">
                      jane@northwind.com
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
                  Signed in as jane@northwind.com
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="size-4" /> Workspace settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Sparkles className="size-4" /> Upgrade plan
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
