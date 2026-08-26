import { cookies } from "next/headers"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata = {
  title: "Dashboard · Bright",
  description: "Recordings, summaries, and workspace activity.",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Persisted collapse state, so the server renders the same width the user left.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        className="h-svh min-h-svh overflow-hidden bg-canvas"
      >
        <AppSidebar />
        <SidebarInset className="flex h-svh min-w-0 flex-col overflow-hidden bg-canvas">
          <DashboardTopbar />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
