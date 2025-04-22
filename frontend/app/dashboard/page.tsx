"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, Receipt, PieChart, ArrowRight } from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  console.log(user)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "User"}!</h1>
        <p className="text-muted-foreground">Here's an overview of your receipt tracking and expenses.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Upload Receipt"
          description="Scan a new receipt and let AI extract the details"
          icon={<Upload className="h-5 w-5" />}
          href="/dashboard/upload"
        />
        <DashboardCard
          title="View Receipts"
          description="Browse and manage all your uploaded receipts"
          icon={<Receipt className="h-5 w-5" />}
          href="/dashboard/receipts"
        />
        <DashboardCard
          title="Query Receipts"
          description="Ask questions about your receipts and get answers in plain text"
          icon={<PieChart className="h-5 w-5" />}
          href="/dashboard/query"
        />
      </div>

      {/* <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest receipt uploads and edits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <EmptyState
                title="No recent activity"
                description="Start by uploading your first receipt"
                action={
                  <Button asChild>
                    <Link href="/dashboard/upload">Upload Receipt</Link>
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense Summary</CardTitle>
            <CardDescription>Your spending by category this month</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No data available"
              description="Upload receipts to see your expense summary"
              action={
                <Button asChild>
                  <Link href="/dashboard/upload">Upload Receipt</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}

function DashboardCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="link" className="px-0 mt-2 text-emerald-600">
          <Link href={href} className="flex items-center">
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      {action}
    </div>
  )
}
