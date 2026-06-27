import { useState, useMemo } from "react";
import { useRole } from "@/hooks/useRole";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  ShieldCheck,
  Store,
  UserCircle2,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type UserRole = "admin" | "seller" | "customer";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt: string | null;
  imageUrl: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
}

function fetchAdminUsers(search: string, offset: number): Promise<UsersResponse> {
  const params = new URLSearchParams({ limit: "20", offset: String(offset) });
  if (search) params.set("search", search);
  return fetch(`${BASE}/api/admin/users?${params}`, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch users");
    return r.json();
  });
}

async function setUserRole(targetUserId: string, role: UserRole): Promise<void> {
  const r = await fetch(`${BASE}/api/admin/set-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ targetUserId, role }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update role");
  }
}

async function deleteUser(userId: string): Promise<void> {
  const r = await fetch(`${BASE}/api/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete user");
  }
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; badgeClass: string }> = {
  admin: { label: "Admin", icon: Crown, badgeClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
  seller: { label: "Seller", icon: Store, badgeClass: "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100" },
  customer: { label: "Customer", icon: UserCircle2, badgeClass: "bg-muted text-muted-foreground border-border" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.customer;
  return <Badge className={`text-xs ${cfg.badgeClass}`}>{cfg.label}</Badge>;
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(u: AdminUser) {
  if (u.firstName || u.lastName) return `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
  return u.email[0]?.toUpperCase() ?? "?";
}

const PAGE_SIZE = 20;

export default function AdminPanel() {
  const { role, isLoaded } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const searchTimer = useMemo(() => ({ id: 0 as any }), []);
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.id);
    searchTimer.id = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400);
  };

  const queryKey = ["admin-users", debouncedSearch, page];
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchAdminUsers(debouncedSearch, page * PAGE_SIZE),
    enabled: role === "admin",
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: UserRole }) =>
      setUserRole(userId, newRole),
    onMutate: ({ userId }) => setUpdatingId(userId),
    onSuccess: (_, { newRole, userId }) => {
      toast({ title: `Role updated to ${newRole}` });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
    onSettled: () => setUpdatingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      toast({ title: "User deleted" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDelete(null);
    },
    onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
  });

  if (!isLoaded) return null;

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Admin access required</h2>
        <p className="text-muted-foreground mb-6">Only administrators can view this page.</p>
        <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const roleCounts = data?.users.reduce(
    (acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; },
    {} as Record<string, number>
  ) ?? {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage users and their roles across the platform.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(["admin", "seller", "customer"] as UserRole[]).map((r) => {
            const cfg = ROLE_CONFIG[r];
            const Icon = cfg.icon;
            return (
              <Card key={r} className="border-border/60">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.total > 0 ? (roleCounts[r] ?? 0) : "—"}</p>
                      <p className="text-sm text-muted-foreground">{cfg.label}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                All Users
                {data && (
                  <span className="text-sm font-normal text-muted-foreground">({data.total} total)</span>
                )}
              </CardTitle>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-6 pb-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-28 rounded-md" />
                </div>
              ))}
            </div>
          ) : data?.users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users found</p>
              {debouncedSearch && <p className="text-sm mt-1">Try adjusting your search</p>}
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/60">
                {data?.users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm overflow-hidden">
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {user.firstName || user.lastName
                            ? `${user.firstName} ${user.lastName}`.trim()
                            : user.email.split("@")[0]}
                        </p>
                        <RoleBadge role={user.role} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground/60">
                        Joined {formatDate(user.createdAt)} · Last seen {formatDate(user.lastSignInAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={user.role}
                        onValueChange={(val) =>
                          roleMutation.mutate({ userId: user.id, newRole: val as UserRole })
                        }
                        disabled={updatingId === user.id}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDelete(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                      className="h-8 gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="h-8 gap-1"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{confirmDelete?.email}</span> and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
