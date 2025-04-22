"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Receipt, Upload, PieChart, Settings } from "lucide-react"

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

  return (
    <aside className=" top-0 left-0 md:flex flex-col w-64 border-r bg-white h-[calc(100vh-4rem)]">
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
          >
            <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          </Button>
        ))}
      </div>
    </aside>
  )
}
