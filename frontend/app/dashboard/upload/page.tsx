"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, ImageIcon, Check, X, Receipt } from "lucide-react"
import Image from "next/image"

export default function UploadReceiptPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)

      // Reset extracted data
      setExtractedData(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(droppedFile)

      // Reset extracted data
      setExtractedData(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setIsUploading(true)
    setIsProcessing(false)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("receipt", file)
      formData.append("user_id", user.id)

      // Upload to backend
      const response = await fetch("http://localhost:8000/receipts/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload receipt")
      }

      // Process the receipt with AI
      setIsUploading(false)
      setIsProcessing(true)

      const data = await response.json()
      setExtractedData(data)

      toast({
        title: "Receipt uploaded successfully",
        description: "The receipt data has been extracted and saved.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setExtractedData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Receipt</h1>
        <p className="text-muted-foreground">Upload a receipt image and our AI will extract all the details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Receipt Image</CardTitle>
            <CardDescription>Take a photo or upload an image of your receipt</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center h-64 ${
                preview ? "border-emerald-200 bg-emerald-50" : "border-gray-300 hover:border-emerald-300"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {preview ? (
                <div className="relative w-full h-full">
                  <Image src={preview || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-full bg-emerald-100 p-3">
                    <ImageIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Drag and drop your receipt</h3>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse files (JPG, PNG, PDF)</p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Choose File
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleUpload}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!file || isUploading || isProcessing}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload & Process Receipt
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>AI-extracted information from your receipt</CardDescription>
          </CardHeader>
          <CardContent>
            {extractedData ? (
              <div className="space-y-4">
                <div>
                  <Label>Vendor</Label>
                  <div className="p-2 border rounded-md mt-1 bg-gray-50">{extractedData.vendor || "Not detected"}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="p-2 border rounded-md mt-1 bg-gray-50">
                    {extractedData.transaction_date || "Not detected"}
                  </div>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <div className="p-2 border rounded-md mt-1 bg-gray-50">
                    ${extractedData.total_amount || "Not detected"}
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="p-2 border rounded-md mt-1 bg-gray-50">
                    {extractedData.expense_category || "Not detected"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg h-64">
                <div className="mb-4 rounded-full bg-gray-100 p-3">
                  <Receipt className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">No data yet</h3>
                <p className="text-sm text-muted-foreground">Upload a receipt to see the extracted information</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {extractedData && (
              <div className="w-full flex justify-between">
                <Button variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="mr-2 h-4 w-4" /> Save Receipt
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
