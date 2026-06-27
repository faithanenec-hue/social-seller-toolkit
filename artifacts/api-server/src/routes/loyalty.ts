import { Router, type IRouter } from "express";
import { db, loyaltyTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function getTierThresholds(tier: string) {
  const thresholds: Record<string, number> = {
    bronze: 500,
    silver: 2000,
    gold: 5000,
    platinum: 0,
  };
  return thresholds[tier] ?? 500;
}

router.get("/loyalty", requireAuth, async (req: any, res): Promise<void> => {
  const customerRef = req.userId as string;

  let [loyalty] = await db.select().from(loyaltyTable).where(eq(loyaltyTable.customerRef, customerRef));

  if (!loyalty) {
    const code = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    [loyalty] = await db.insert(loyaltyTable).values({ customerRef, referralCode: code }).returning();
  }

  const totalSpent = Number(loyalty.totalSpent);
  const points = loyalty.points;
  const nextTierPoints = getTierThresholds(loyalty.tier);
  const discountEarned = Math.floor(points / 100) * 5;

  res.json({
    points,
    tier: loyalty.tier,
    nextTierPoints,
    totalSpent,
    discountEarned,
    referralCode: loyalty.referralCode,
  });
});

export default router;
