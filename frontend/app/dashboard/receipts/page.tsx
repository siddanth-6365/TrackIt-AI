"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Download as DownloadIcon,
} from "lucide-react";
import { apiURL } from "@/lib/api";

// ---------------- types ----------------
interface Item {
  description: string;
  quantity: number | null;
  unit_price: number | null;
}

interface Receipt {
  id: number;
  user_id: string;
  merchant_name: string;
  merchant_address: string | null;
  merchant_phone: string | null;
  merchant_email: string | null;
  transaction_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  expense_category: string;
  payment_method: string | null;
  image_url: string;
  created_at: string;
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Items modal state
  const [itemsOpen, setItemsOpen] = useState<boolean>(false);
  const [currentItems, setCurrentItems] = useState<Item[]>([]);

  // Image modal state
  const [imageOpen, setImageOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  // Fetch all receipts on mount
  useEffect(() => {
    if (user) fetchReceipts();
  }, [user]);

  async function fetchReceipts() {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiURL}/receipts/user/${user!.id}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setReceipts(data.receipts);
    } catch {
      toast({
        title: "Error",
        description: "Could not load receipts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch items for a single receipt
  async function viewItems(receiptId: number) {
    try {
      const res = await fetch(`${apiURL}/receipts/${receiptId}/items`);
      if (!res.ok) throw new Error("Items fetch failed");
      const items: Item[] = await res.json();
      setCurrentItems(items);
      setItemsOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Could not load items.",
        variant: "destructive",
      });
    }
  }

  // Show image modal
  function viewImage(url: string) {
    setCurrentImage(url);
    setImageOpen(true);
  }

  const filtered = receipts.filter((r) =>
    r.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.expense_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Eye className="mr-2 h-4 w-4" /> Upload New
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
                placeholder="Search..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="p-6 text-center">Loading…</p>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center p-8 border border-dashed rounded-lg text-center">
              <Eye className="h-6 w-6 text-gray-500 mb-2" />
              No receipts yet
            </div>
          ) : (
            <div className="overflow-auto ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Created At</TableHead>

                    {/* <TableHead className="text-right">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.merchant_name}</TableCell>
                      <TableCell>{r.merchant_address ?? "—"}</TableCell>
                      <TableCell>{r.merchant_phone ?? "—"}</TableCell>
                      <TableCell>{r.merchant_email ?? "—"}</TableCell>
                      <TableCell>{new Date(r.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>{r.subtotal_amount.toFixed(2)}</TableCell>
                      <TableCell>{r.tax_amount.toFixed(2)}</TableCell>
                      <TableCell>{r.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{r.expense_category}</TableCell>
                      <TableCell>{r.payment_method ?? "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewItems(r.id)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewImage(r.image_url)}
                        >
                          <DownloadIcon className="mr-1 h-4 w-4" /> View Image
                        </Button>
                      </TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>

                      {/* <TableCell className="text-right space-x-2">
                     
                        <Button size="icon" onClick={() => viewItems(r.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={() => viewImage(r.image_url)}>
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Dialog */}
      <Dialog open={itemsOpen} onOpenChange={setItemsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Itemised List</DialogTitle>
            <CardDescription>
              {currentItems.length}{" "}
              {currentItems.length === 1 ? "item" : "items"}
            </CardDescription>
          </DialogHeader>
          {currentItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell className="text-right">
                      {it.quantity ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {it.unit_price != null
                        ? `$${it.unit_price.toFixed(2)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-4 text-center">No items found.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt Image</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <img
              src={currentImage}
              alt="Receipt"
              className="max-h-96 w-auto rounded shadow"
            />
            <a
              href={currentImage}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                <DownloadIcon className="mr-2 h-4 w-4" /> Download
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
