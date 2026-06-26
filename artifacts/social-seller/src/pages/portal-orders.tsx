import { useState } from "react";
import { useLocation } from "wouter";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  payment_received: "bg-emerald-100 text-emerald-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed", payment_received: "Payment Received", processing: "Processing",
  shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};

export default function PortalOrders() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");

  const params = statusFilter ? { status: statusFilter } : {};
  const { data: orders, isLoading } = useListOrders(params, {
    query: { queryKey: getListOrdersQueryKey(params) },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground mt-1">Track all your orders in one place.</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Orders</SelectItem>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusFilter && <Button variant="ghost" onClick={() => setStatusFilter("")} className="text-muted-foreground">Clear</Button>}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-all cursor-pointer border-border/60"
              onClick={() => setLocation(`/portal/orders/${order.id}`)}
              data-testid={`portal-order-${order.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{order.orderNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-xs text-muted-foreground">Tracking: <span className="font-mono">{order.trackingNumber}</span></p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">${Number(order.total).toFixed(2)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
