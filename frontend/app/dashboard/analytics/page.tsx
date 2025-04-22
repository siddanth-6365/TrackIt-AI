"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Receipt, DollarSign, Calendar, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("month")
  const { user } = useAuth()
  const [hasData, setHasData] = useState(false)

  // This would normally fetch data from the backend
  useEffect(() => {
    // Simulate checking if user has receipt data
    setHasData(false)
  }, [user, timeframe])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Insights and visualizations of your spending patterns</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center p-12">
            <div className="mb-4 rounded-full bg-gray-100 p-3">
              <PieChart className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">No data to analyze yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Upload some receipts to see analytics and insights about your spending patterns
            </p>
            <Button asChild>
              <Link href="/dashboard/upload">Upload Receipts</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Spent"
            value="$1,245.89"
            description={`This ${timeframe}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend="+12.5%"
            trendDirection="up"
          />
          <StatCard
            title="Receipts"
            value="24"
            description={`This ${timeframe}`}
            icon={<Receipt className="h-5 w-5" />}
            trend="+4"
            trendDirection="up"
          />
          <StatCard
            title="Avg. Transaction"
            value="$51.91"
            description={`This ${timeframe}`}
            icon={<ShoppingBag className="h-5 w-5" />}
            trend="-3.2%"
            trendDirection="down"
          />
          <StatCard
            title="Most Active Day"
            value="Saturday"
            description={`This ${timeframe}`}
            icon={<Calendar className="h-5 w-5" />}
            trend="No change"
            trendDirection="neutral"
          />
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">[Pie Chart Visualization]</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
                <CardDescription>How your spending has changed over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">[Bar Chart Visualization]</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Places where you spend the most</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">[Horizontal Bar Chart Visualization]</div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({ title, value, description, icon, trend, trendDirection }: { title: string; value: string; description: string; icon: React.ReactNode; trend?: string; trendDirection?: "up" | "down" | "neutral" }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div
            className={`mt-2 flex items-center text-xs ${trendDirection === "up" ? "text-green-600" : trendDirection === "down" ? "text-red-600" : "text-gray-500"
              }`}
          >
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
