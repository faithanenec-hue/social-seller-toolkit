import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, CheckCircle2, ShieldCheck, Users, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SellerAccess() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const { role } = useRole();
  const { toast } = useToast();
  const [sellerCode, setSellerCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<"seller" | "admin" | null>(null);

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <Store className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Setup</h2>
            <p className="text-muted-foreground mb-6">Sign in first to claim your access.</p>
            <Button onClick={() => setLocation("/sign-in")} className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">You already have admin access</h2>
            <p className="text-muted-foreground mb-6">Full dashboard and admin panel are available.</p>
            <Button onClick={() => setLocation("/")} className="w-full">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "seller") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">You already have seller access</h2>
            <p className="text-muted-foreground mb-6">You can access the full seller dashboard.</p>
            <Button onClick={() => setLocation("/")} className="w-full">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleClaim = async (type: "seller" | "admin") => {
    const code = type === "seller" ? sellerCode : adminCode;
    const endpoint = type === "seller" ? "/api/auth/claim-seller" : "/api/auth/claim-admin";

    if (!code.trim()) {
      toast({ title: "Please enter an invite code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inviteCode: code.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to claim access");
      }
      setSuccess(type);
      toast({ title: `${type === "admin" ? "Admin" : "Seller"} access granted! Reloading…` });
      setTimeout(() => {
        user.reload().then(() => setLocation("/"));
      }, 1500);
    } catch (err) {
      toast({
        title: "Invalid invite code",
        description: err instanceof Error ? err.message : "Please check your code and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <p className="font-semibold text-lg">
              {success === "admin" ? "Admin access granted!" : "Seller access granted!"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">Redirecting to your dashboard…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Claim Access</h1>
          <p className="text-muted-foreground mt-2">Enter your invite code to unlock the dashboard</p>
        </div>

        <Card className="border-border/60 shadow-lg shadow-violet-100">
          <Tabs defaultValue="seller">
            <CardHeader className="pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="seller" className="flex-1 gap-2">
                  <Store className="h-3.5 w-3.5" />
                  Seller
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex-1 gap-2">
                  <Crown className="h-3.5 w-3.5" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="seller">
              <CardContent className="space-y-4 pt-2">
                <CardDescription className="text-sm">
                  Unlock captions, broadcasts, and orders tools.
                </CardDescription>
                <div className="space-y-2">
                  <Label htmlFor="seller-code">Seller Invite Code</Label>
                  <Input
                    id="seller-code"
                    type="text"
                    placeholder="Enter seller invite code"
                    value={sellerCode}
                    onChange={(e) => setSellerCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleClaim("seller")}
                  />
                </div>
                <Button
                  onClick={() => handleClaim("seller")}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Verifying…" : "Claim Seller Access"}
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="admin">
              <CardContent className="space-y-4 pt-2">
                <CardDescription className="text-sm">
                  Full access including user management and the admin panel.
                </CardDescription>
                <div className="space-y-2">
                  <Label htmlFor="admin-code">Admin Invite Code</Label>
                  <Input
                    id="admin-code"
                    type="text"
                    placeholder="Enter admin invite code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleClaim("admin")}
                  />
                </div>
                <Button
                  onClick={() => handleClaim("admin")}
                  disabled={loading}
                  className="w-full"
                  variant="secondary"
                >
                  {loading ? "Verifying…" : "Claim Admin Access"}
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-card border text-sm">
            <Store className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Seller Access</p>
              <p className="text-muted-foreground text-xs">Captions, broadcasts, orders</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-card border text-sm">
            <Crown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Admin Access</p>
              <p className="text-muted-foreground text-xs">Everything + user management</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{user.emailAddresses?.[0]?.emailAddress}</span>
          {" · "}
          <button onClick={() => setLocation("/portal")} className="text-primary hover:underline">
            Go to Customer Portal
          </button>
        </p>
      </div>
    </div>
  );
}
