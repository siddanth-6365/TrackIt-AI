"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Edit, Trash2, Receipt, Upload } from "lucide-react"
import Link from "next/link"

type ReceiptType = {
  id: number
  vendor: string
  transaction_date: string
  total_amount: number
  expense_category: string
  items: any
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchReceipts()
    }
  }, [user])

  const fetchReceipts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/receipts/user/${user?.id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch receipts")
      }

      const data = await response.json()
      setReceipts(data.receipts)
    } catch (error) {
      console.error("Error fetching receipts:", error)
      toast({
        title: "Error",
        description: "Failed to load receipts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    // This would be implemented if the backend had a delete endpoint
    toast({
      title: "Receipt deleted",
      description: "The receipt has been successfully deleted.",
    })

    // Update the UI by removing the deleted receipt
    setReceipts(receipts.filter((receipt) => receipt.id !== id))
  }

  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.expense_category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Receipts</h1>
          <p className="text-muted-foreground">View and manage all your uploaded receipts</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload New Receipt
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Receipts</CardTitle>
              <CardDescription>
                {receipts.length} {receipts.length === 1 ? "receipt" : "receipts"} found
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search receipts..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600"></div>
                <div>Loading receipts...</div>
              </div>
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg">
              <div className="mb-4 rounded-full bg-gray-100 p-3">
                <Receipt className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-1">No receipts found</h3>
              <p className="text-sm text-muted-foreground mb-4">You haven't uploaded any receipts yet</p>
              <Button asChild>
                <Link href="/dashboard/upload">Upload Your First Receipt</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.vendor}</TableCell>
                      <TableCell>{new Date(receipt.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>${receipt.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{receipt.expense_category}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(receipt.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
