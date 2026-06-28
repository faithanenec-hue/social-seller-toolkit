import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListOrders,
  useGetOrderSummary,
  useGetRecentOrders,
  getUpdateOrderStatusMutationOptions,
  getListOrdersQueryKey,
  getGetOrderSummaryQueryKey,
  getGetRecentOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  payment_received: "Payment Received",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
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

const STATUSES = Object.keys(STATUS_LABELS);

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");
  const [estDelivery, setEstDelivery] = useState("");

  const params = statusFilter ? { status: statusFilter } : {};
  const { data: orders, isLoading } = useListOrders(params, {
    query: { queryKey: getListOrdersQueryKey(params) },
  });
  const { data: summary } = useGetOrderSummary({ query: { queryKey: getGetOrderSummaryQueryKey() } });

  const updateStatus = useMutation({
    ...getUpdateOrderStatusMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOrderSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentOrdersQueryKey() });
      setUpdatingOrder(null);
      toast({ title: "Order status updated" });
    },
  });

  const openUpdate = (order: any) => {
    setUpdatingOrder(order);
    setNewStatus(order.status);
    setTracking(order.trackingNumber ?? "");
    setCourier(order.courier ?? "");
    setEstDelivery(order.estimatedDelivery ?? "");
  };

  const handleUpdateStatus = () => {
    if (!updatingOrder || !newStatus) return;
    updateStatus.mutate({
      id: updatingOrder.id,
      data: {
        status: newStatus as any,
        ...(tracking && { trackingNumber: tracking }),
        ...(courier && { courier }),
        ...(estDelivery && { estimatedDelivery: estDelivery }),
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground mt-1">Track and manage all customer orders.</p>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.activeOrders}</p>
                <p className="text-xs text-muted-foreground">Active Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.deliveredOrders}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        {statusFilter && <Button variant="ghost" onClick={() => setStatusFilter("")} className="text-muted-foreground">Clear</Button>}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => (
            <Card key={order.id} className="hover:shadow-sm transition-all border-border/60" data-testid={`order-row-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                      {order.paymentStatus === "pending" && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">Payment Pending</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customerName} · {order.customerEmail}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-bold">£{Number(order.total).toFixed(2)}</span>
                    {order.paymentStatus === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({
                          id: order.id,
                          data: { status: "payment_received" as any },
                        })}
                      >
                        ✓ Mark Paid
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setLocation(`/orders/${order.id}`)} data-testid={`btn-view-order-${order.id}`}>
                      <Eye className="h-3.5 w-3.5" />View
                    </Button>
                    <Button size="sm" onClick={() => openUpdate(order)} data-testid={`btn-update-order-${order.id}`}>Update Status</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No orders yet</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!updatingOrder} onOpenChange={(open) => !open && setUpdatingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tracking Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. DHL123456789" data-testid="input-tracking" />
            </div>
            <div className="space-y-2">
              <Label>Courier <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. DHL, FedEx" data-testid="input-courier" />
            </div>
            <div className="space-y-2">
              <Label>Estimated Delivery <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={estDelivery} onChange={(e) => setEstDelivery(e.target.value)} placeholder="e.g. 3-5 business days" data-testid="input-est-delivery" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatingOrder(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending} data-testid="btn-confirm-update">
              {updateStatus.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
