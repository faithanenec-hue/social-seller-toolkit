import { useRoute, useLocation } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, CheckCircle, Circle, Printer } from "lucide-react";

const STEPS = [
  { key: "confirmed", label: "Order Confirmed", desc: "We have received your order" },
  { key: "payment_received", label: "Payment Received", desc: "Payment has been confirmed" },
  { key: "processing", label: "Processing", desc: "Your order is being prepared" },
  { key: "shipped", label: "Shipped", desc: "Your order is on its way" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "Your order is nearby" },
  { key: "delivered", label: "Delivered", desc: "Your order has arrived!" },
];

const STATUS_ORDER: Record<string, number> = {
  confirmed: 0, payment_received: 1, processing: 2, shipped: 3, out_for_delivery: 4, delivered: 5,
};

export default function PortalOrderDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/portal/orders/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!order) return (
    <div className="text-center py-16 text-muted-foreground">
      <p>Order not found</p>
      <Button variant="outline" className="mt-4" onClick={() => setLocation("/portal/orders")}>Back</Button>
    </div>
  );

  const currentStep = STATUS_ORDER[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      <div>
        <button onClick={() => setLocation("/portal/orders")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />Back to My Orders
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()} data-testid="btn-print-receipt">
            <Printer className="h-3.5 w-3.5" />Receipt
          </Button>
        </div>
      </div>

      {!isCancelled ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Delivery Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const current = i === currentStep;
                  return (
                    <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0" data-testid={`step-${step.key}`}>
                      <div className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all ${done ? "bg-primary text-primary-foreground shadow-md" : "bg-background border-2 border-border"}`}>
                        {done ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4 text-border" />}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                        <p className={`text-xs mt-0.5 ${current ? "text-primary" : "text-muted-foreground"}`}>
                          {current ? step.desc : done ? "Completed" : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center text-red-700">
            <p className="font-semibold">This order has been cancelled</p>
          </CardContent>
        </Card>
      )}

      {(order.trackingNumber || order.courier || order.estimatedDelivery) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tracking Info</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
            {order.trackingNumber && <div><p className="text-xs text-muted-foreground mb-1">Tracking Number</p><p className="font-mono font-medium">{order.trackingNumber}</p></div>}
            {order.courier && <div><p className="text-xs text-muted-foreground mb-1">Courier</p><p className="font-medium">{order.courier}</p></div>}
            {order.estimatedDelivery && <div><p className="text-xs text-muted-foreground mb-1">Est. Delivery</p><p className="font-medium">{order.estimatedDelivery}</p></div>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Order Summary</CardTitle>
            <span className="text-lg font-bold">${Number(order.total).toFixed(2)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm" data-testid={`receipt-item-${item.id}`}>
                <div>
                  <p className="font-medium">{item.productTitle}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity} @ ${Number(item.price).toFixed(2)}</p>
                </div>
                <p className="font-semibold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
            <span>Payment Status</span>
            <span className={`font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
              {order.paymentStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
