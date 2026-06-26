import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    total: Number(o.total),
  };
}

router.get("/orders/summary", async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const statusBreakdown = Object.entries(
    allOrders.reduce((acc: Record<string, number>, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  res.json({
    totalOrders: allOrders.length,
    totalRevenue,
    activeOrders: allOrders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
    deliveredOrders: allOrders.filter((o) => o.status === "delivered").length,
    cancelledOrders: allOrders.filter((o) => o.status === "cancelled").length,
    pendingPayments: allOrders.filter((o) => o.paymentStatus === "pending").length,
    statusBreakdown,
  });
});

router.get("/orders/recent", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
  res.json(orders.map(formatOrder));
});

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status } = parsed.data;
  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(formatOrder));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, customerEmail, items } = parsed.data;

  let total = 0;
  const resolvedItems: { productId: number; productTitle: string; quantity: number; price: number }[] = [];

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const price = Number(product.price);
    total += price * item.quantity;
    resolvedItems.push({ productId: item.productId, productTitle: product.title, quantity: item.quantity, price });
  }

  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const [order] = await db.insert(ordersTable).values({ customerName, customerEmail, total: total.toString(), orderNumber }).returning();

  for (const item of resolvedItems) {
    await db.insert(orderItemsTable).values({ orderId: order.id, ...item, price: item.price.toString() });
  }

  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

  res.json({
    ...formatOrder(order),
    items: items.map((i) => ({ ...i, price: Number(i.price) })),
  });
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateOrderStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.trackingNumber) updateData.trackingNumber = parsed.data.trackingNumber;
  if (parsed.data.courier) updateData.courier = parsed.data.courier;
  if (parsed.data.estimatedDelivery) updateData.estimatedDelivery = parsed.data.estimatedDelivery;
  if (parsed.data.status === "payment_received") updateData.paymentStatus = "paid";

  const [order] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(formatOrder(order));
});

export default router;
