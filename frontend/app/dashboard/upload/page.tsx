"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon, Check, X, Receipt, Plus, Trash2, DownloadIcon } from "lucide-react";
import { apiURL } from "@/lib/api";

const UploadReceiptPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  /* ---------- helpers ---------- */
  const readPreview = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };
  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  /* ---------- drag / file change ---------- */
  const setNewFile = (f: File) => {
    setFile(f);
    readPreview(f);
    setExtractedData(null);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setNewFile(e.target.files[0]);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setNewFile(e.dataTransfer.files[0]);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  /* ------ change handlers ------ */
  const updateField = (key: string, value: any) => {
    setExtractedData((prev: any) => ({ ...prev, [key]: value }));
  };
  const updateItem = (idx: number, key: string, value: any) => {
    setExtractedData((prev: any) => {
      const items = [...(prev.items || [])];
      items[idx] = { ...items[idx], [key]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    const newItem = { name: "", quantity: 1, price: 0 };
    setExtractedData((prev: any) => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };
  const deleteItem = (idx: number) => {
    setExtractedData((prev: any) => {
      const items = [...(prev.items || [])];
      items.splice(idx, 1);
      return { ...prev, items };
    });
  };

  /* ------ extract ------ */
  const extractReceipt = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("user_id", user.id);
    try {
      const res = await fetch(`${apiURL}/receipts/extract`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setExtractedData(json);
      toast({ title: "Extraction complete", description: "Review and edit before saving." });
    } catch (e: any) {
      toast({ title: "Extract failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  /* ------ save ------ */
  const saveReceipt = async () => {
    if (!extractedData || !user || !file) return;
    setIsProcessing(true);
  
    // 1) build FormData
    const form = new FormData();
    form.append("user_id", user.id);
    form.append("file", file);
    // payload must be a JSON string
    form.append("payload", JSON.stringify(extractedData));
  
    try {
      // 2) no explicit Content-Type header here
      const res = await fetch(`${apiURL}/receipts/save`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
  
      toast({ title: "Receipt saved!" });
      resetForm();
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (


    <div className="max-w-2xl mx-auto">
      {!extractedData ? (

        <Card>
          <CardHeader className="flex flex-row justify-between">
            <div>
              <CardTitle>Upload Receipt Image</CardTitle>
              <CardDescription>Drag a photo or browse files</CardDescription>
            </div>
            <div>
              <a href="/receipt1.jpg" download>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="mr-1 h-4 w-4" /> Download Test Image
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center h-64 ${preview ? "border-emerald-200 bg-emerald-50" : "border-gray-300 hover:border-emerald-300"
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {preview ? (
                <div className="relative w-full h-full">
                  <Image src={preview} alt="Receipt preview" fill className="object-contain" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-full bg-emerald-100 p-3">
                    <ImageIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Drag & drop</h3>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Choose File
                  </Button>
                  <Input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={extractReceipt}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!file || isUploading || isProcessing}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload & Process
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Review & Edit</CardTitle>
            <CardDescription>Update any incorrect fields before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedData ? (
              <>
                {/* ── top‐level fields ── */}
                {[
                  { key: "merchant_name", label: "Merchant" },
                  { key: "merchant_address", label: "Address" },
                  { key: "merchant_phone", label: "Phone" },
                  { key: "merchant_email", label: "Email" },
                  { key: "transaction_date", label: "Date" },
                  { key: "subtotal_amount", label: "Subtotal" },
                  { key: "tax_amount", label: "Tax" },
                  { key: "total_amount", label: "Total" },
                  { key: "payment_method", label: "Payment Method" },
                  { key: "expense_category", label: "Category" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      value={extractedData[key] ?? ""}
                      className="mt-1"
                      onChange={(e) => updateField(key, e.target.value)}
                    />
                  </div>
                ))}

                {/* ── items ── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Items</Label>
                    <Button size="sm" variant="outline" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-auto max-h-52">
                    {extractedData.items?.length ? (
                      <table className="min-w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left">Description</th>
                            <th className="px-2 py-1 text-right">Qty</th>
                            <th className="px-2 py-1 text-right">Unit Price</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {extractedData.items.map((it: any, i: number) => (
                            <tr key={i} className="odd:bg-white even:bg-gray-50">
                              <td className="px-2 py-1">
                                <Input
                                  value={it.description ?? ""}
                                  onChange={(e) => updateItem(i, "description", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-1 w-20">
                                <Input
                                  type="number"
                                  value={it.quantity ?? ""}
                                  onChange={(e) => updateItem(i, "quantity", +e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-1 w-28">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={it.unit_price ?? ""}
                                  onChange={(e) => updateItem(i, "unit_price", +e.target.value)}
                                />
                              </td>
                              <td className="px-1 py-1 text-right">
                                <Button size="icon" variant="ghost" onClick={() => deleteItem(i)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="p-2 text-muted-foreground">No items</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg h-64">
                <Receipt className="h-6 w-6 text-gray-500 mb-2" />
                <p>Extract data first</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {extractedData && (
              <div className="w-full flex justify-end space-x-2">
                <Button variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button
                  onClick={saveReceipt}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Check className="mr-2 h-4 w-4" />
                  }
                  Save Receipt
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      )
      }
    </div>

  );
};

export default UploadReceiptPage;
