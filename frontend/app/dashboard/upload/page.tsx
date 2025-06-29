"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ScanningAnimation } from "@/components/scanning-animation"
import {
  Loader2,
  Upload,
  ImageIcon,
  Check,
  X,
  Receipt,
  Plus,
  Trash2,
  Download,
  Store,
  Calendar,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  Camera,
  Scan,
} from "lucide-react"
import { apiURL } from "@/lib/api"
import { cn } from "@/lib/utils"

type ProcessingState = "idle" | "scanning" | "editing" | "saving"

export default function UploadReceiptPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processingState, setProcessingState] = useState<ProcessingState>("idle")
  const [extractedData, setExtractedData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  /* ---------- helpers ---------- */
  const readPreview = (f: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setExtractedData(null)
    setProcessingState("idle")
    fileInputRef.current && (fileInputRef.current.value = "")
  }

  /* ---------- drag / file change ---------- */
  const setNewFile = (f: File) => {
    setFile(f)
    readPreview(f)
    setExtractedData(null)
    setProcessingState("idle")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setNewFile(e.target.files[0])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files?.[0]) setNewFile(e.dataTransfer.files[0])
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  /* ------ change handlers ------ */
  const updateField = (key: string, value: any) => {
    setExtractedData((prev: any) => ({ ...prev, [key]: value }))
  }

  const updateItem = (idx: number, key: string, value: any) => {
    setExtractedData((prev: any) => {
      const items = [...(prev.items || [])]
      items[idx] = { ...items[idx], [key]: value }
      return { ...prev, items }
    })
  }

  const addItem = () => {
    const newItem = { description: "", quantity: 1, unit_price: 0 }
    setExtractedData((prev: any) => ({ ...prev, items: [...(prev.items || []), newItem] }))
  }

  const deleteItem = (idx: number) => {
    setExtractedData((prev: any) => {
      const items = [...(prev.items || [])]
      items.splice(idx, 1)
      return { ...prev, items }
    })
  }

  /* ------ extract ------ */
  const extractReceipt = async () => {
    if (!file || !user) return

    setProcessingState("scanning")

    const form = new FormData()
    form.append("file", file)
    form.append("user_id", user.id)

    try {
      const res = await fetch(`${apiURL}/receipts/extract`, { method: "POST", body: form })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setExtractedData(json)
    } catch (e: any) {
      toast({ title: "Extract failed", description: e.message, variant: "destructive" })
      setProcessingState("idle")
    }
  }

  const handleScanComplete = () => {
    setProcessingState("editing")
    toast({ title: "Extraction complete", description: "Review and edit before saving." })
  }

  /* ------ save ------ */
  const saveReceipt = async () => {
    if (!extractedData || !user || !file) return

    setProcessingState("saving")

    const form = new FormData()
    form.append("user_id", user.id)
    form.append("file", file)
    form.append("payload", JSON.stringify(extractedData))

    try {
      const res = await fetch(`${apiURL}/receipts/save`, {
        method: "POST",
        body: form,
      })

      if (!res.ok) throw new Error(await res.text())

      toast({ title: "Receipt saved successfully!", description: "Your receipt has been added to your collection." })
      resetForm()
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message || "Something went wrong",
        variant: "destructive",
      })
      setProcessingState("editing")
    }
  }

  // Show scanning animation
  if (processingState === "scanning" && preview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Camera className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Processing Receipt</h1>
            <p className="text-muted-foreground">AI is analyzing your receipt image</p>
          </div>
        </div>
        <ScanningAnimation imagePreview={preview} onComplete={handleScanComplete} />
      </div>
    )
  }

  // Show editing form
  if ((processingState === "editing" || processingState === "saving") && extractedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setProcessingState("idle")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Review & Edit Receipt</h1>
              <p className="text-muted-foreground">Verify the extracted information before saving</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Receipt Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Original Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                {preview && (
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-100">
                    <Image src={preview || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Merchant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  Merchant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="merchant_name">Business Name *</Label>
                    <Input
                      id="merchant_name"
                      value={extractedData.merchant_name ?? ""}
                      onChange={(e) => updateField("merchant_name", e.target.value)}
                      placeholder="Enter business name"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="merchant_address">Address</Label>
                    <Textarea
                      id="merchant_address"
                      value={extractedData.merchant_address ?? ""}
                      onChange={(e) => updateField("merchant_address", e.target.value)}
                      placeholder="Enter business address"
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchant_phone">Phone</Label>
                    <Input
                      id="merchant_phone"
                      value={extractedData.merchant_phone ?? ""}
                      onChange={(e) => updateField("merchant_phone", e.target.value)}
                      placeholder="Phone number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchant_email">Email</Label>
                    <Input
                      id="merchant_email"
                      type="email"
                      value={extractedData.merchant_email ?? ""}
                      onChange={(e) => updateField("merchant_email", e.target.value)}
                      placeholder="Email address"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="transaction_date">Date *</Label>
                    <Input
                      id="transaction_date"
                      type="date"
                      value={extractedData.transaction_date ?? ""}
                      onChange={(e) => updateField("transaction_date", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Input
                      id="payment_method"
                      value={extractedData.payment_method ?? ""}
                      onChange={(e) => updateField("payment_method", e.target.value)}
                      placeholder="Cash, Card, etc."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense_category">Category</Label>
                    <Input
                      id="expense_category"
                      value={extractedData.expense_category ?? ""}
                      onChange={(e) => updateField("expense_category", e.target.value)}
                      placeholder="Food, Transport, etc."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Items ({extractedData.items?.length || 0})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {extractedData.items?.length ? (
                  <div className="space-y-3">
                    {extractedData.items.map((item: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50/50">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            Item {index + 1}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(index)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.description ?? ""}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              placeholder="Item description"
                              className="mt-1"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity ?? ""}
                              onChange={(e) => updateItem(index, "quantity", +e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-xs">Unit Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price ?? ""}
                              onChange={(e) => updateItem(index, "unit_price", +e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No items added yet</p>
                    <Button size="sm" variant="outline" onClick={addItem} className="mt-2 bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Amount Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="subtotal_amount">Subtotal</Label>
                    <Input
                      id="subtotal_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={extractedData.subtotal_amount ?? ""}
                      onChange={(e) => updateField("subtotal_amount", +e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_amount">Tax</Label>
                    <Input
                      id="tax_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={extractedData.tax_amount ?? ""}
                      onChange={(e) => updateField("tax_amount", +e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_amount">Total *</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={extractedData.total_amount ?? ""}
                      onChange={(e) => updateField("total_amount", +e.target.value)}
                      className="mt-1 font-semibold"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-emerald-600">
                    ${extractedData.total_amount ? Number(extractedData.total_amount).toFixed(2) : "0.00"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pb-6">
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveReceipt}
                disabled={processingState === "saving"}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processingState === "saving" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show upload form
  return (
    <div className="space-y-6">
      {/* <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Upload className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Receipt</h1>
          <p className="text-muted-foreground">Upload a photo or scan of your receipt to get started</p>
        </div>
      </div> */}

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            Upload Receipt Image
          </CardTitle>
          <CardDescription>Drag and drop your receipt or click to browse files</CardDescription>
        </CardHeader>

        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] transition-all duration-200",
              preview
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {preview ? (
              <div className="relative w-full max-w-md">
                <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-white shadow-lg">
                  <Image src={preview || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
                {/* <div className="mt-4 p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-900">{file?.name}</p>
                  <p className="text-xs text-gray-500">
                    {file?.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
                  </p>
                </div> */}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drop your receipt here</h3>
                <p className="text-gray-500 mb-6">or click to browse files</p>
                <Button onClick={() => fileInputRef.current?.click()} size="lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
                  <span>Supports: JPG, PNG, PDF</span>
                  <span>•</span>
                  <span>Max size: 10MB</span>
                </div>
              </>
            )}
          </div>

          {!preview && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Need a test receipt?</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Download our sample receipt to try out the AI extraction feature.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/receipt1.jpg" download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Sample
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {preview && (
          <CardFooter>
            <Button
              onClick={extractReceipt}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!file || processingState !== "idle"}
              size="lg"
            >
              <Scan className="w-4 h-4 mr-2" />
              Process Receipt with AI
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
