import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SellerAccess() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const { role } = useRole();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <Store className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Seller Access</h2>
            <p className="text-muted-foreground mb-6">Sign in first to claim your seller access.</p>
            <Button onClick={() => setLocation("/sign-in")} className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "seller" || role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">You already have {role} access</h2>
            <p className="text-muted-foreground mb-6">You can access the seller dashboard.</p>
            <Button onClick={() => setLocation("/")} className="w-full">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleClaim = async () => {
    if (!inviteCode.trim()) {
      toast({ title: "Please enter an invite code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/claim-seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to claim access");
      }
      setSuccess(true);
      toast({ title: "Seller access granted! Reloading..." });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Claim Seller Access</h1>
          <p className="text-muted-foreground mt-2">Enter your invite code to unlock the seller dashboard</p>
        </div>

        {success ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-lg">Access granted!</p>
              <p className="text-muted-foreground text-sm mt-1">Redirecting to your dashboard…</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 shadow-lg shadow-violet-100">
            <CardHeader>
              <CardTitle className="text-lg">Seller Invite Code</CardTitle>
              <CardDescription>Contact the admin to get your seller invite code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                />
              </div>
              <Button onClick={handleClaim} disabled={loading} className="w-full">
                {loading ? "Verifying…" : "Claim Seller Access"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-card border text-sm">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Seller Access</p>
              <p className="text-muted-foreground text-xs">Full toolkit — captions, broadcasts, orders</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-card border text-sm">
            <Users className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Customer Portal</p>
              <p className="text-muted-foreground text-xs">Already active on your account</p>
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
