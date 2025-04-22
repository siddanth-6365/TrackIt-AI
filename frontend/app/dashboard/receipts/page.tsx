"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Receipt,
  Upload,
  Eye,
} from "lucide-react";
import { apiURL } from "@/lib/api";

// ---------------- types ----------------
interface Item { name: string; quantity: number | null; price: number | null }
interface Receipt {
  id: number;
  vendor: string;
  transaction_date: string;
  total_amount: number;
  expense_category: string;
  items: Item[];
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [currentItems, setCurrentItems] = useState<Item[]>([]);

  // -------------- fetch --------------
  useEffect(() => {
    if (user) fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiURL}/receipts/user/${user!.id}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setReceipts(data.receipts);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    toast({ title: "Deleted (mock)" });
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = receipts.filter(
    (r) =>
      r.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.expense_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // -------------- UI --------------
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"> Receipts</h1>
          <p className="text-muted-foreground">View and manage your receipts</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload New
          </Link>
        </Button>
      </div>

      {/* main card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {/* <CardTitle>All Receipts</CardTitle> */}
              <CardDescription>
                {receipts.length} {receipts.length === 1 ? "receipt" : "receipts"}
              </CardDescription>
            </div>
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
              <Receipt className="h-6 w-6 text-gray-500 mb-2" />
              No receipts yet
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
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.vendor}</TableCell>
                      <TableCell>{new Date(r.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>${r.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{r.expense_category}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentItems(r.items || []);
                            setOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(r.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* -------- Items dialog -------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Itemised list</DialogTitle>
            <DialogDescription>
              {currentItems.length} item{currentItems.length !== 1 && "s"}
            </DialogDescription>
          </DialogHeader>
          {currentItems.length ? (
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-right">Qty</th>
                  <th className="px-2 py-1 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((it, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="px-2 py-1">{it.name}</td>
                    <td className="px-2 py-1 text-right">{it.quantity ?? "—"}</td>
                    <td className="px-2 py-1 text-right">{it.price != null ? `$${it.price}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">No items</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
