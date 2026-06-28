import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useCart } from "@/contexts/cart";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCart, ImageOff, Plus, Minus, Trash2, Package, CheckCircle2,
} from "lucide-react";

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

async function fetchProducts(): Promise<Product[]> {
  const r = await fetch(`${BASE}/api/products`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load products");
  return r.json();
}

async function placeOrder(payload: {
  customerName: string;
  customerEmail: string;
  items: { productId: number; quantity: number }[];
}) {
  const r = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Failed to place order"); }
  return r.json();
}

function CartSheet() {
  const { items, total, count, removeItem, updateQty } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2">
            <ShoppingCart className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col w-[340px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart ({count} item{count !== 1 ? "s" : ""})
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-3 py-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">£{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">£{(item.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
                <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
                  Checkout
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

function CheckoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useUser();
  const { items, total, clear } = useCart();
  const { toast } = useToast();
  const [name, setName] = useState(
    user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : ""
  );
  const [email, setEmail] = useState(
    user?.emailAddresses?.[0]?.emailAddress ?? ""
  );
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      placeOrder({
        customerName: name.trim(),
        customerEmail: email.trim(),
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    onSuccess: (order) => {
      setSuccess({ orderNumber: order.orderNumber });
      clear();
    },
    onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
  });

  const handleClose = () => {
    setSuccess(null);
    onClose();
  };

  const canSubmit = name.trim() && email.trim() && email.includes("@") && items.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        {success ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold">Order placed!</h2>
            <p className="text-muted-foreground text-sm">
              Your order <span className="font-semibold text-foreground">{success.orderNumber}</span> has been received. You can track it in My Orders.
            </p>
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete your order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                {items.map((i) => (
                  <div key={i.productId} className="flex justify-between text-sm">
                    <span className="text-foreground">{i.title} × {i.quantity}</span>
                    <span className="font-medium">£{(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1 border-t mt-1">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
                {mutation.isPending ? "Placing order…" : `Pay £${total.toFixed(2)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PortalShop() {
  const { items: cartItems, addItem } = useCart();
  const { toast } = useToast();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const inStock = products?.filter((p) => p.inStock) ?? [];

  const handleAdd = (p: Product) => {
    addItem({ id: p.id, title: p.title, price: p.price, imageUrl: p.imageUrl });
    setAddedIds((prev) => new Set([...prev, p.id]));
    toast({ title: `${p.title} added to cart` });
    setTimeout(() => setAddedIds((prev) => { const s = new Set(prev); s.delete(p.id); return s; }), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
          <p className="text-muted-foreground mt-1">Browse available products and place an order.</p>
        </div>
        <CartSheet />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : inStock.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg">No products available yet</p>
          <p className="text-sm mt-1">Check back soon — new products are on the way.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inStock.map((p) => {
            const inCart = cartItems.find((i) => i.productId === p.id);
            return (
              <Card key={p.id} className="border-border/60 overflow-hidden group">
                <div className="h-44 bg-muted flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground leading-tight">{p.title}</p>
                      <p className="text-lg font-bold text-primary shrink-0">£{p.price.toFixed(2)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">{p.niche}</Badge>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                  <Button
                    className="w-full"
                    variant={addedIds.has(p.id) ? "secondary" : "default"}
                    onClick={() => handleAdd(p)}
                  >
                    {addedIds.has(p.id) ? (
                      <><CheckCircle2 className="h-4 w-4 mr-2" /> Added!</>
                    ) : inCart ? (
                      <><Plus className="h-4 w-4 mr-2" /> Add Another</>
                    ) : (
                      <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
