"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/upload": "Upload Receipt",
  "/dashboard/query": "Query Receipts",
  "/dashboard/receipts": "My Receipts",
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "Profile",
}

export function Navbar() {
  const pathname = usePathname()

  const pathSegments = pathname.split("/").filter(Boolean)
  const currentPageTitle = routeLabels[pathname] || "Dashboard"

  const generateBreadcrumbs = () => {
    if (pathname === "/dashboard") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage>Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    const breadcrumbs = []
    let currentPath = ""

    // Add Dashboard as first breadcrumb for sub-pages
    breadcrumbs.push(
      <BreadcrumbItem key="dashboard">
        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
      </BreadcrumbItem>,
    )

    // Add separator
    if (pathSegments.length > 1) {
      breadcrumbs.push(<BreadcrumbSeparator key="sep-dashboard" />)
    }

    // Add current page
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      if (index === 0) return // Skip 'dashboard' as we already added it

      const isLast = index === pathSegments.length - 1
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)

      if (isLast) {
        breadcrumbs.push(
          <BreadcrumbItem key={currentPath}>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>,
        )
      } else {
        breadcrumbs.push(
          <BreadcrumbItem key={currentPath}>
            <BreadcrumbLink href={currentPath}>{label}</BreadcrumbLink>
          </BreadcrumbItem>,
        )
        breadcrumbs.push(<BreadcrumbSeparator key={`sep-${currentPath}`} />)
      }
    })

    return breadcrumbs
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>{generateBreadcrumbs()}</BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
