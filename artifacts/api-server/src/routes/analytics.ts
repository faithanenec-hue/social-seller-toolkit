import { Router, type IRouter } from "express";
import { db, ordersTable, captionsTable, broadcastTemplatesTable, savedCaptionsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/overview", async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const uniqueCustomers = new Set(allOrders.map((o) => o.customerEmail)).size;

  const captionsUsed = await db.select({ total: sql<number>`sum(${captionsTable.usageCount})` }).from(captionsTable);
  const broadcastsTotal = await db.select({ total: sql<number>`sum(${broadcastTemplatesTable.usageCount})` }).from(broadcastTemplatesTable);

  const topNichesRaw = await db
    .select({ niche: captionsTable.niche, count: sql<number>`count(*)` })
    .from(captionsTable)
    .groupBy(captionsTable.niche)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
  allOrders.slice(0, 30).forEach((o) => {
    const date = new Date(o.createdAt).toISOString().split("T")[0];
    if (!revenueByDay[date]) revenueByDay[date] = { revenue: 0, orders: 0 };
    revenueByDay[date].revenue += Number(o.total);
    revenueByDay[date].orders += 1;
  });

  const sortedDays = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));

  const emailCounts: Record<string, number> = {};
  allOrders.forEach((o) => { emailCounts[o.customerEmail] = (emailCounts[o.customerEmail] ?? 0) + 1; });
  const repeatCustomers = Object.values(emailCounts).filter((c) => c > 1).length;
  const repeatPurchaseRate = uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0;

  res.json({
    totalRevenue,
    totalOrders: allOrders.length,
    totalCustomers: uniqueCustomers,
    captionsUsed: Number(captionsUsed[0]?.total ?? 0),
    broadcastsSent: Number(broadcastsTotal[0]?.total ?? 0),
    topNiches: topNichesRaw.map((n) => ({ niche: n.niche, count: Number(n.count) })),
    revenueByDay: sortedDays,
    repeatPurchaseRate: Math.round(repeatPurchaseRate * 100) / 100,
  });
});

export default router;
