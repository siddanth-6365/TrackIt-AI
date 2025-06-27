"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Search, Eye, DownloadIcon, Calendar, MapPin, Phone, Mail, CreditCard, Package } from "lucide-react"
import { apiURL } from "@/lib/api"

// ---------------- types ----------------
interface Item {
  description: string
  quantity: number | null
  unit_price: number | null
}

interface ReceiptData {
  id: number
  user_id: string
  merchant_name: string
  merchant_address: string | null
  merchant_phone: string | null
  merchant_email: string | null
  transaction_date: string
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  expense_category: string
  payment_method: string | null
  image_url: string
  created_at: string
}

export default function ReceiptsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Receipt details modal state
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)

  // Items modal state
  const [itemsOpen, setItemsOpen] = useState<boolean>(false)
  const [currentItems, setCurrentItems] = useState<Item[]>([])

  // Image modal state
  const [imageOpen, setImageOpen] = useState<boolean>(false)
  const [currentImage, setCurrentImage] = useState<string>("")

  // Fetch all receipts on mount
  useEffect(() => {
    if (user) fetchReceipts()
  }, [user])

  async function fetchReceipts() {
    setIsLoading(true)
    try {
      const res = await fetch(`${apiURL}/receipts/user/${user!.id}`)
      if (!res.ok) throw new Error("Fetch failed")
      const data = await res.json()
      setReceipts(data.receipts)
    } catch {
      toast({
        title: "Error",
        description: "Could not load receipts.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch items for a single receipt
  async function viewItems(receiptId: number) {
    try {
      const res = await fetch(`${apiURL}/receipts/${receiptId}/items`)
      if (!res.ok) throw new Error("Items fetch failed")
      const items: Item[] = await res.json()
      setCurrentItems(items)
      setItemsOpen(true)
    } catch {
      toast({
        title: "Error",
        description: "Could not load items.",
        variant: "destructive",
      })
    }
  }

  // Show image modal
  function viewImage(url: string) {
    setCurrentImage(url)
    setImageOpen(true)
  }

  // Show receipt details
  function viewDetails(receipt: ReceiptData) {
    setSelectedReceipt(receipt)
    setDetailsOpen(true)
  }

  const filtered = receipts.filter(
    (r) =>
      r.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.expense_category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      transport: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      shopping: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      business: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }
    return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">View and manage your receipts</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/upload">
            <Package className="mr-2 h-4 w-4" /> Upload New
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardDescription>
              {receipts.length} {receipts.length === 1 ? "receipt" : "receipts"}
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchant or category..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center p-8 border border-dashed rounded-lg text-center">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No receipts yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by uploading your first receipt</p>
              <Button asChild>
                <Link href="/dashboard/upload">Upload Receipt</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="min-w-[200px]">Merchant</TableHead>
                    <TableHead className="w-32">Date</TableHead>
                    <TableHead className="w-24 text-right">Total</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                    <TableHead className="w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((receipt) => (
                    <TableRow
                      key={receipt.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => viewDetails(receipt)}
                    >
                      <TableCell className="font-mono text-sm">#{receipt.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{receipt.merchant_name}</div>
                        {receipt.merchant_address && (
                          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {receipt.merchant_address}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(receipt.transaction_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right font-medium">${receipt.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryColor(receipt.expense_category)}>
                          {receipt.expense_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              viewItems(receipt.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              viewImage(receipt.image_url)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Receipt Details - #{selectedReceipt?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6">
              {/* Merchant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Merchant Information
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-medium">{selectedReceipt.merchant_name}</p>
                    </div>
                    {selectedReceipt.merchant_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{selectedReceipt.merchant_address}</p>
                      </div>
                    )}
                    {selectedReceipt.merchant_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{selectedReceipt.merchant_phone}</p>
                      </div>
                    )}
                    {selectedReceipt.merchant_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{selectedReceipt.merchant_email}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Transaction Details
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(selectedReceipt.transaction_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge className={getCategoryColor(selectedReceipt.expense_category)}>
                        {selectedReceipt.expense_category}
                      </Badge>
                    </div>
                    {selectedReceipt.payment_method && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Payment:</span>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          <span>{selectedReceipt.payment_method}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Amount Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold">Amount Breakdown</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>${selectedReceipt.subtotal_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>${selectedReceipt.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>${selectedReceipt.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => viewItems(selectedReceipt.id)} variant="outline" className="flex-1">
                  <Package className="mr-2 h-4 w-4" />
                  View Items
                </Button>
                <Button onClick={() => viewImage(selectedReceipt.image_url)} variant="outline" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  View Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Items Dialog */}
      <Dialog open={itemsOpen} onOpenChange={setItemsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itemized List
            </DialogTitle>
            <CardDescription>
              {currentItems.length} {currentItems.length === 1 ? "item" : "items"}
            </CardDescription>
          </DialogHeader>
          {currentItems.length > 0 ? (
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20 text-center">Qty</TableHead>
                    <TableHead className="w-24 text-right">Unit Price</TableHead>
                    <TableHead className="w-24 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {item.unit_price != null ? `$${item.unit_price.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity && item.unit_price ? `$${(item.quantity * item.unit_price).toFixed(2)}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">No items found for this receipt.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Receipt Image
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="max-h-[70vh] overflow-auto">
              <img
                src={currentImage || "/placeholder.svg"}
                alt="Receipt"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <Button asChild>
              <a href={currentImage} download target="_blank" rel="noopener noreferrer">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Image
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
