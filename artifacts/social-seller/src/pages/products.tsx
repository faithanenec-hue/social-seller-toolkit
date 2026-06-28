import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2, ImageOff, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Product {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  niche: string;
  imageUrl?: string | null;
  inStock: boolean;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  niche: string;
  imageUrl: string;
  inStock: boolean;
}

const empty: ProductForm = { title: "", description: "", price: "", niche: "", imageUrl: "", inStock: true };

async function fetchProducts(search: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const r = await fetch(`${BASE}/api/products?${params}`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to fetch products");
  return r.json();
}

async function saveProduct(data: ProductForm, id?: number): Promise<Product> {
  const url = id ? `${BASE}/api/products/${id}` : `${BASE}/api/products`;
  const method = id ? "PATCH" : "POST";
  const r = await fetch(url, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, price: parseFloat(data.price) }),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Failed to save product"); }
  return r.json();
}

async function deleteProduct(id: number): Promise<void> {
  const r = await fetch(`${BASE}/api/products/${id}`, { method: "DELETE", credentials: "include" });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Failed to delete product"); }
}

async function toggleStock(id: number, inStock: boolean): Promise<Product> {
  const r = await fetch(`${BASE}/api/products/${id}`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inStock }),
  });
  if (!r.ok) throw new Error("Failed to update stock");
  return r.json();
}

export default function Products() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dSearch, setDSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState<any>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", dSearch],
    queryFn: () => fetchProducts(dSearch),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveProduct(form, editProduct?.id),
    onSuccess: (p) => {
      toast({ title: editProduct ? "Product updated" : "Product added" });
      qc.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
    onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      toast({ title: "Product deleted" });
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleteTarget(null);
    },
    onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, inStock }: { id: number; inStock: boolean }) => toggleStock(id, inStock),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
    onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
  });

  const openAdd = () => { setEditProduct(null); setForm(empty); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ title: p.title, description: p.description ?? "", price: String(p.price), niche: p.niche, imageUrl: p.imageUrl ?? "", inStock: p.inStock });
    setModalOpen(true);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDSearch(v), 400));
  };

  const canSave = form.title.trim() && form.price && !isNaN(parseFloat(form.price)) && parseFloat(form.price) > 0 && form.niche.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalogue. Customers can browse and buy from the shop.</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products…" value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg">No products yet</p>
          <p className="text-sm mt-1">Click "Add Product" to create your first product.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((p) => (
            <Card key={p.id} className="border-border/60 overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                )}
              </div>
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground leading-tight">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.niche}</p>
                  </div>
                  <p className="text-lg font-bold text-primary shrink-0">£{p.price.toFixed(2)}</p>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.inStock}
                      onCheckedChange={(v) => stockMutation.mutate({ id: p.id, inStock: v })}
                      id={`stock-${p.id}`}
                    />
                    <Label htmlFor={`stock-${p.id}`} className="text-xs cursor-pointer">
                      {p.inStock ? <span className="text-emerald-600 font-medium">In Stock</span> : <span className="text-muted-foreground">Out of Stock</span>}
                    </Label>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. Premium Lash Set" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (£) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Niche / Category *</Label>
                <Input placeholder="e.g. Beauty" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Short product description…" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input placeholder="https://…" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="instock-modal" checked={form.inStock} onCheckedChange={(v) => setForm({ ...form, inStock: v })} />
              <Label htmlFor="instock-modal">In Stock</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the product. Existing orders won't be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
