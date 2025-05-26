"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Receipt, Upload, PieChart, Settings, X } from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"
import { useEffect } from "react"

const sidebarItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Upload Receipt",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    name: "Query Receipts",
    href: "/dashboard/query",
    icon: PieChart,
  },
  {
    name: "My Receipts",
    href: "/dashboard/receipts",
    icon: Receipt,
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, setSidebarOpen } = useSidebar()

  // Close sidebar on Escape key (mobile)
  useEffect(() => {
    if (!isSidebarOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isSidebarOpen, setSidebarOpen])

  // Overlay click closes sidebar (mobile)
  const handleOverlayClick = () => setSidebarOpen(false)

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
        onClick={handleOverlayClick}
      />
      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-white shadow-lg transition-transform duration-300 md:static md:translate-x-0 md:shadow-none md:flex h-[calc(100vh-4rem)]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
        role="navigation"
        aria-label="Sidebar"
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="text-lg font-semibold text-emerald-700">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        <div className="flex flex-col gap-1 p-4">
          {sidebarItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "justify-start",
                pathname === item.href && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700",
              )}
              asChild
              onClick={() => setSidebarOpen(false)} // Close sidebar on nav (mobile)
            >
              <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </Button>
          ))}
        </div>
      </aside>
    </>
  )
}
