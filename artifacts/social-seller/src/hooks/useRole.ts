import { useUser } from "@clerk/react";

export type UserRole = "admin" | "seller" | "customer";

export function useRole(): { role: UserRole; isLoaded: boolean; isSignedIn: boolean } {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = (user?.publicMetadata?.role as UserRole) || "customer";
  return { role, isLoaded, isSignedIn: !!isSignedIn };
}

export function isSellerOrAdmin(role: UserRole): boolean {
  return role === "seller" || role === "admin";
}
