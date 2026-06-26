import { useState } from "react";
import { useLocation } from "wouter";
import { useListBroadcasts, getListBroadcastsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Sparkles, Search, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState as useLocalState } from "react";

const CATEGORIES = ["Welcome", "New Arrival", "Flash Sale", "Restock", "Holiday", "Payment Reminder", "Delivery Update", "Customer Appreciation", "Re-engagement"];
const NICHES = ["Fashion", "Hair", "Food", "Jewellery", "Beauty", "Electronics", "General"];

const CATEGORY_COLORS: Record<string, string> = {
  "Flash Sale": "bg-orange-100 text-orange-700",
  "New Arrival": "bg-emerald-100 text-emerald-700",
  "Welcome": "bg-blue-100 text-blue-700",
  "Restock": "bg-purple-100 text-purple-700",
  "Holiday": "bg-red-100 text-red-700",
  "Payment Reminder": "bg-yellow-100 text-yellow-700",
  "Delivery Update": "bg-cyan-100 text-cyan-700",
  "Customer Appreciation": "bg-pink-100 text-pink-700",
  "Re-engagement": "bg-violet-100 text-violet-700",
};

function BroadcastCard({ template }: { template: any }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(template.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Broadcast message copied!" });
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border/60" data-testid={`broadcast-card-${template.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <CardTitle className="text-base">{template.title}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge className={`text-xs ${CATEGORY_COLORS[template.category] ?? "bg-muted text-muted-foreground"}`} variant="outline">
                {template.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">{template.niche}</Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant={copied ? "default" : "outline"}
            className="gap-1.5 text-xs shrink-0"
            onClick={handleCopy}
            data-testid={`btn-copy-broadcast-${template.id}`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-5">{template.message}</p>
        <p className="text-xs text-muted-foreground mt-3">{template.usageCount} uses</p>
      </CardContent>
    </Card>
  );
}

export default function Broadcasts() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [niche, setNiche] = useState("");

  const params = {
    ...(search && { search }),
    ...(category && { category }),
    ...(niche && { niche }),
  };

  const { data: templates, isLoading } = useListBroadcasts(params, {
    query: { queryKey: getListBroadcastsQueryKey(params) },
  });

  const clearFilters = () => { setSearch(""); setCategory(""); setNiche(""); };
  const hasFilters = search || category || niche;

  const grouped = (templates ?? []).reduce((acc: Record<string, any[]>, t) => {
    const cat = t.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broadcast Library</h1>
          <p className="text-muted-foreground mt-1">Ready-to-send WhatsApp broadcast templates for every occasion.</p>
        </div>
        <Button onClick={() => setLocation("/broadcasts/generate")} className="gap-2" data-testid="btn-generate-broadcast">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-broadcasts"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger className="w-[150px]" data-testid="select-niche"><SelectValue placeholder="Niche" /></SelectTrigger>
          <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters && <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">Clear</Button>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : hasFilters ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((t) => <BroadcastCard key={t.id} template={t} />)}
          {templates?.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No templates found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-sm ${CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground"}`}>{cat}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => <BroadcastCard key={t.id} template={t} />)}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No templates yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
