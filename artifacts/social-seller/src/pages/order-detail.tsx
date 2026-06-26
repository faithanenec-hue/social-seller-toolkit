import { useRoute, useLocation } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";

const STEPS = [
  { key: "confirmed", label: "Order Confirmed" },
  { key: "payment_received", label: "Payment Received" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_ORDER: Record<string, number> = {
  confirmed: 0, payment_received: 1, processing: 2, shipped: 3, out_for_delivery: 4, delivered: 5,
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  payment_received: "bg-emerald-100 text-emerald-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/orders/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      <div>
        <button onClick={() => setLocation("/orders")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />Back to Orders
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>
            {order.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Customer Info</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs mb-1">Name</p><p className="font-medium">{order.customerName}</p></div>
          <div><p className="text-muted-foreground text-xs mb-1">Email</p><p className="font-medium">{order.customerEmail}</p></div>
          <div><p className="text-muted-foreground text-xs mb-1">Order Date</p><p className="font-medium">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p></div>
          <div><p className="text-muted-foreground text-xs mb-1">Payment</p>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {order.paymentStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
          {order.trackingNumber && <div><p className="text-muted-foreground text-xs mb-1">Tracking</p><p className="font-mono font-medium">{order.trackingNumber}</p></div>}
          {order.courier && <div><p className="text-muted-foreground text-xs mb-1">Courier</p><p className="font-medium">{order.courier}</p></div>}
          {order.estimatedDelivery && <div><p className="text-muted-foreground text-xs mb-1">Est. Delivery</p><p className="font-medium">{order.estimatedDelivery}</p></div>}
        </CardContent>
      </Card>

      {!isCancelled && (
        <Card>
          <CardHeader><CardTitle className="text-base">Order Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i <= currentStep;
                const current = i === currentStep;
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${current ? "ring-4 ring-primary/20" : ""}`}>
                      {done ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                      {current && <p className="text-xs text-primary mt-0.5">Current status</p>}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`absolute left-[19px] mt-8 h-6 w-0.5 ${done ? "bg-primary" : "bg-border"}`} style={{ position: "relative", left: "-4.5rem", top: "0.5rem" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Order Items</CardTitle>
            <span className="text-lg font-bold">${Number(order.total).toFixed(2)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`order-item-${item.id}`}>
                <div>
                  <p className="text-sm font-medium">{item.productTitle}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
