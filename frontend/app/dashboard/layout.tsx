import type React from "react"
import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/sidebar"

// import { SidebarProvider } from "@/components/sidebar-context"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <div className="flex flex-1 flex-col bg-muted/50 gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl  md:min-h-min p-4 md:p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
