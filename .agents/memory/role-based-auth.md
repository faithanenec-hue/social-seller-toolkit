---
name: Role-based auth
description: How Seller/Admin/Customer roles are implemented in this app
---

# Role-Based Auth

## Roles
- `admin` — full access to seller dashboard + can set other users' roles
- `seller` — access to seller dashboard (captions, broadcasts, orders, analytics)
- `customer` — access only to customer portal (/portal/*)

## Storage
Roles stored in Clerk `publicMetadata.role`. Default for new users: `customer`.

## Frontend
- `src/hooks/useRole.ts` — reads `user.publicMetadata.role`
- `SellerGuardContent` in App.tsx — wraps all seller routes, checks isSignedIn + role
- `PortalGuard` in App.tsx — wraps portal routes, checks isSignedIn only
- Sidebar shows role badge (Admin/Seller/Customer) and hides seller mode toggle for customers

## Backend
- `src/middlewares/requireRole.ts` — calls `clerkClient.users.getUser(userId)` to fetch role (NOT JWT claims — Replit-managed Clerk doesn't expose publicMetadata in JWT by default)
- `src/routes/auth.ts` — `/api/auth/me`, `/api/auth/claim-seller`, `/api/admin/set-role`

## Seller Access Flow
1. User signs up → gets `customer` role by default
2. To become a seller: visit `/seller-access` and enter invite code
3. Invite code stored in `SELLER_INVITE_CODE` env var (default: `seller-access-2024`)
4. On success: Clerk API sets `publicMetadata.role = "seller"`, user reloads and is redirected to `/`

**Why:** Clerk's Replit-managed instance doesn't allow JWT template customization, so publicMetadata is NOT in session claims. Must use `clerkClient.users.getUser()` on the backend for role checks.
