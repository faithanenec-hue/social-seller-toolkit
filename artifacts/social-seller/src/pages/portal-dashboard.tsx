import { useLocation } from "wouter";
import { useListOrders, useGetLoyalty, getListOrdersQueryKey, getGetLoyaltyQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, CheckCircle, XCircle, Clock, Gift, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  payment_received: "bg-emerald-100 text-emerald-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-700 bg-amber-100",
  silver: "text-slate-600 bg-slate-100",
  gold: "text-yellow-700 bg-yellow-100",
  platinum: "text-violet-700 bg-violet-100",
};

export default function PortalDashboard() {
  const [, setLocation] = useLocation();

  const { data: orders, isLoading: ordersLoading } = useListOrders({}, {
    query: { queryKey: getListOrdersQueryKey({}) },
  });
  const { data: loyalty, isLoading: loyaltyLoading } = useGetLoyalty({
    query: { queryKey: getGetLoyaltyQueryKey() },
  });

  const active = orders?.filter((o) => !["delivered", "cancelled"].includes(o.status)) ?? [];
  const delivered = orders?.filter((o) => o.status === "delivered") ?? [];
  const cancelled = orders?.filter((o) => o.status === "cancelled") ?? [];
  const recent = orders?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your orders and rewards.</p>
      </div>

      {ordersLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/portal/orders")} data-testid="card-active-orders">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-muted-foreground">Active Orders</span>
              </div>
              <p className="text-3xl font-bold">{active.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/portal/orders")} data-testid="card-delivered-orders">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">Delivered</span>
              </div>
              <p className="text-3xl font-bold">{delivered.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/portal/orders")} data-testid="card-cancelled-orders">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-sm text-muted-foreground">Cancelled</span>
              </div>
              <p className="text-3xl font-bold">{cancelled.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loyaltyLoading ? <Skeleton className="h-24 rounded-xl" /> : loyalty && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 cursor-pointer hover:shadow-md transition-all" onClick={() => setLocation("/portal/loyalty")} data-testid="card-loyalty">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${TIER_COLORS[loyalty.tier] ?? "bg-muted"}`}>{loyalty.tier}</span>
                </div>
                <p className="font-bold text-lg">{loyalty.points.toLocaleString()} Points</p>
                <p className="text-xs text-muted-foreground">${loyalty.discountEarned} discount earned</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/portal/orders")} data-testid="btn-view-all-orders">View All</Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/portal/orders/${order.id}`)}
                  data-testid={`portal-order-row-${order.id}`}
                >
                  <div>
                    <p className="text-sm font-mono font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>
                      {order.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-sm font-bold">${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
