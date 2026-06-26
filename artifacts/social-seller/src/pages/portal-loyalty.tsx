import { useGetLoyalty, getGetLoyaltyQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Star, TrendingUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TIER_DETAILS: Record<string, { color: string; bg: string; min: number; max: number; perks: string[] }> = {
  bronze: {
    color: "text-amber-700", bg: "bg-amber-100",
    min: 0, max: 500,
    perks: ["Earn 1 point per $1 spent", "Birthday discount", "Early access to sales"],
  },
  silver: {
    color: "text-slate-600", bg: "bg-slate-100",
    min: 500, max: 2000,
    perks: ["Earn 1.5x points", "Free shipping on orders over $50", "Priority customer support"],
  },
  gold: {
    color: "text-yellow-700", bg: "bg-yellow-100",
    min: 2000, max: 5000,
    perks: ["Earn 2x points", "Exclusive member deals", "Free gift on birthday", "Dedicated support line"],
  },
  platinum: {
    color: "text-violet-700", bg: "bg-violet-100",
    min: 5000, max: 5000,
    perks: ["Earn 3x points", "VIP early access", "Personal shopper", "Monthly exclusive drops"],
  },
};

const TIER_ORDER = ["bronze", "silver", "gold", "platinum"];

export default function PortalLoyalty() {
  const { toast } = useToast();
  const { data: loyalty, isLoading } = useGetLoyalty({
    query: { queryKey: getGetLoyaltyQueryKey() },
  });

  const handleCopyCode = () => {
    if (!loyalty?.referralCode) return;
    navigator.clipboard.writeText(loyalty.referralCode);
    toast({ title: "Referral code copied!" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!loyalty) return null;

  const tierInfo = TIER_DETAILS[loyalty.tier] ?? TIER_DETAILS.bronze;
  const progress = loyalty.tier === "platinum" ? 100 : Math.min(100, (loyalty.points / loyalty.nextTierPoints) * 100);
  const nextTier = TIER_ORDER[TIER_ORDER.indexOf(loyalty.tier) + 1];

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loyalty Rewards</h1>
        <p className="text-muted-foreground mt-1">Earn points with every purchase and unlock exclusive perks.</p>
      </div>

      <Card className={`border-2 ${tierInfo.bg.replace("bg-", "border-").replace("100", "200")}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`h-16 w-16 rounded-full ${tierInfo.bg} flex items-center justify-center`}>
              <Gift className={`h-8 w-8 ${tierInfo.color}`} />
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest ${tierInfo.bg} ${tierInfo.color}`}>
                {loyalty.tier} Member
              </span>
              <p className="text-3xl font-bold mt-1">{loyalty.points.toLocaleString()} pts</p>
            </div>
          </div>

          {loyalty.tier !== "platinum" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTier}</span>
                <span className="font-medium">{loyalty.points} / {loyalty.nextTierPoints} pts</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                  data-testid="progress-bar"
                />
              </div>
              <p className="text-xs text-muted-foreground">{loyalty.nextTierPoints - loyalty.points} more points to reach {nextTier}</p>
            </div>
          )}

          {loyalty.tier === "platinum" && (
            <div className="text-center py-2">
              <Star className={`h-6 w-6 mx-auto mb-1 ${tierInfo.color}`} />
              <p className={`font-semibold ${tierInfo.color}`}>You've reached the highest tier!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-xl font-bold">${Number(loyalty.totalSpent).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Discount Earned</p>
              <p className="text-xl font-bold text-green-600">${loyalty.discountEarned}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{loyalty.tier.charAt(0).toUpperCase() + loyalty.tier.slice(1)} Member Perks</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tierInfo.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-3" data-testid={`perk-${i}`}>
                <div className={`h-5 w-5 rounded-full ${tierInfo.bg} flex items-center justify-center flex-shrink-0`}>
                  <Star className={`h-3 w-3 ${tierInfo.color}`} />
                </div>
                <span className="text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Your Referral Code</p>
            <p className="font-mono text-lg font-bold tracking-widest text-primary">{loyalty.referralCode}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Share and earn bonus points for each referral</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyCode} data-testid="btn-copy-referral">
            <Share2 className="h-3.5 w-3.5" />Copy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
