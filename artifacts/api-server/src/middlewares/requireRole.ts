import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export type UserRole = "admin" | "seller" | "customer";

export async function getUserRole(userId: string): Promise<UserRole> {
  const user = await clerkClient.users.getUser(userId);
  return (user.publicMetadata?.role as UserRole) || "customer";
}

export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = getAuth(req);
    console.log("[requireRole] auth.userId:", auth.userId, "| Authorization header:", req.headers.authorization?.slice(0, 30));
    if (!auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const role = await getUserRole(auth.userId);
    if (!roles.includes(role)) {
      res.status(403).json({ error: "Forbidden", requiredRoles: roles, currentRole: role });
      return;
    }

    (req as any).userId = auth.userId;
    (req as any).userRole = role;
    next();
  };
}
