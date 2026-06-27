import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole, getUserRole } from "../middlewares/requireRole";
import type { UserRole } from "../middlewares/requireRole";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const role = await getUserRole(userId);
  res.json({ userId, role });
});

router.post("/auth/claim-seller", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const { inviteCode } = req.body;

  const expectedCode = process.env.SELLER_INVITE_CODE || "seller-access-2024";
  if (!inviteCode || inviteCode !== expectedCode) {
    res.status(403).json({ error: "Invalid invite code" });
    return;
  }

  const currentRole = await getUserRole(userId);
  if (currentRole === "admin") {
    res.json({ role: "admin", message: "Already an admin" });
    return;
  }

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { role: "seller" },
  });

  res.json({ role: "seller", message: "Seller access granted" });
});

router.post("/admin/set-role", requireRole("admin"), async (req, res): Promise<void> => {
  const { targetUserId, role } = req.body;
  const validRoles: UserRole[] = ["admin", "seller", "customer"];

  if (!targetUserId || !role || !validRoles.includes(role)) {
    res.status(400).json({ error: "targetUserId and valid role (admin|seller|customer) are required" });
    return;
  }

  await clerkClient.users.updateUserMetadata(targetUserId, {
    publicMetadata: { role },
  });

  res.json({ targetUserId, role });
});

export default router;
