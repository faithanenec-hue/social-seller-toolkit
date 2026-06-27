import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListBroadcasts,
  useUpdateBroadcastStats,
  useScheduleBroadcast,
  getListBroadcastsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Copy, Check, Sparkles, Search, Megaphone, BarChart2, CalendarClock, SendHorizonal, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

function formatRate(count: number, total: number) {
  if (!total) return "—";
  return `${((count / total) * 100).toFixed(1)}%`;
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function BroadcastCard({
  template,
  onSchedule,
  onUpdateStats,
}: {
  template: any;
  onSchedule: (t: any) => void;
  onUpdateStats: (t: any) => void;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isScheduled = !!template.scheduledAt && !template.sentAt;
  const isSent = !!template.sentAt;
  const hasStats = isSent || template.sentCount > 0;

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
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-base truncate">{template.title}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge className={`text-xs ${CATEGORY_COLORS[template.category] ?? "bg-muted text-muted-foreground"}`} variant="outline">
                {template.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">{template.niche}</Badge>
              {isScheduled && (
                <Badge className="text-xs bg-amber-100 text-amber-700 gap-1" variant="outline">
                  <Clock className="h-3 w-3" />
                  {formatDate(template.scheduledAt)}
                </Badge>
              )}
              {isSent && (
                <Badge className="text-xs bg-green-100 text-green-700 gap-1" variant="outline">
                  <CheckCircle2 className="h-3 w-3" />
                  Sent {formatDate(template.sentAt)}
                </Badge>
              )}
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
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">{template.message}</p>

        {hasStats && (
          <div className="flex gap-4 pt-2 border-t border-border/50 text-xs">
            <div className="text-center">
              <p className="font-semibold text-foreground">{template.sentCount.toLocaleString()}</p>
              <p className="text-muted-foreground">Sent</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{formatRate(template.openCount, template.sentCount)}</p>
              <p className="text-muted-foreground">Open Rate</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{formatRate(template.clickCount, template.sentCount)}</p>
              <p className="text-muted-foreground">Click Rate</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{template.openCount}</p>
              <p className="text-muted-foreground">Opens</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground flex-1">{template.usageCount} uses</p>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onSchedule(template)}>
            <CalendarClock className="h-3 w-3" />
            {isScheduled ? "Reschedule" : isSent ? "Re-send" : "Schedule"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onUpdateStats(template)}>
            <BarChart2 className="h-3 w-3" />
            Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Broadcasts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [niche, setNiche] = useState("");

  const [schedulingTemplate, setSchedulingTemplate] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [markSent, setMarkSent] = useState(false);

  const [statsTemplate, setStatsTemplate] = useState<any | null>(null);
  const [sentCount, setSentCount] = useState("");
  const [openCount, setOpenCount] = useState("");
  const [clickCount, setClickCount] = useState("");

  const params = {
    ...(search && { search }),
    ...(category && { category }),
    ...(niche && { niche }),
  };

  const { data: templates, isLoading } = useListBroadcasts(params, {
    query: { queryKey: getListBroadcastsQueryKey(params) },
  });

  const scheduleM = useScheduleBroadcast({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBroadcastsQueryKey() });
        setSchedulingTemplate(null);
        toast({ title: "Broadcast updated" });
      },
    },
  });

  const statsM = useUpdateBroadcastStats({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBroadcastsQueryKey() });
        setStatsTemplate(null);
        toast({ title: "Stats updated" });
      },
    },
  });

  const clearFilters = () => { setSearch(""); setCategory(""); setNiche(""); };
  const hasFilters = search || category || niche;

  const allTemplates = templates ?? [];
  const templatesList = allTemplates.filter((t) => !t.scheduledAt && !t.sentAt);
  const scheduledList = allTemplates.filter((t) => t.scheduledAt && !t.sentAt);
  const sentList = allTemplates.filter((t) => !!t.sentAt);

  const grouped = (hasFilters ? allTemplates : templatesList).reduce((acc: Record<string, any[]>, t) => {
    const cat = t.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const openSchedule = (t: any) => {
    setSchedulingTemplate(t);
    setScheduleDate(t.scheduledAt ? new Date(t.scheduledAt).toISOString().slice(0, 16) : "");
    setMarkSent(false);
  };

  const openStats = (t: any) => {
    setStatsTemplate(t);
    setSentCount(String(t.sentCount ?? 0));
    setOpenCount(String(t.openCount ?? 0));
    setClickCount(String(t.clickCount ?? 0));
  };

  const handleSchedule = () => {
    if (!schedulingTemplate) return;
    const data: any = {};
    if (markSent) {
      data.sentAt = new Date().toISOString();
      data.scheduledAt = null;
    } else if (scheduleDate) {
      data.scheduledAt = new Date(scheduleDate).toISOString();
      data.sentAt = null;
    } else {
      data.scheduledAt = null;
      data.sentAt = null;
    }
    scheduleM.mutate({ id: schedulingTemplate.id, data });
  };

  const handleUpdateStats = () => {
    if (!statsTemplate) return;
    statsM.mutate({
      id: statsTemplate.id,
      data: {
        sentCount: parseInt(sentCount) || 0,
        openCount: parseInt(openCount) || 0,
        clickCount: parseInt(clickCount) || 0,
      },
    });
  };

  const CardGrid = ({ list }: { list: any[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {list.map((t) => (
        <BroadcastCard key={t.id} template={t} onSchedule={openSchedule} onUpdateStats={openStats} />
      ))}
      {list.length === 0 && (
        <div className="col-span-full text-center py-16 text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nothing here yet</p>
        </div>
      )}
    </div>
  );

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
        <CardGrid list={allTemplates} />
      ) : (
        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Templates ({templatesList.length})</TabsTrigger>
            <TabsTrigger value="scheduled">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Scheduled ({scheduledList.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Sent ({sentList.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <div className="space-y-8">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-sm ${CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground"}`}>{cat}</span>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((t) => (
                      <BroadcastCard key={t.id} template={t} onSchedule={openSchedule} onUpdateStats={openStats} />
                    ))}
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
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {scheduledList.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No scheduled broadcasts</p>
                <p className="text-sm mt-1">Click "Schedule" on any template to set a send time</p>
              </div>
            ) : (
              <CardGrid list={scheduledList} />
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sentList.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <SendHorizonal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No sent broadcasts yet</p>
                <p className="text-sm mt-1">Mark a broadcast as sent to track its engagement</p>
              </div>
            ) : (
              <CardGrid list={sentList} />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Schedule Dialog */}
      <Dialog open={!!schedulingTemplate} onOpenChange={(open) => !open && setSchedulingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground font-medium truncate">{schedulingTemplate?.title}</p>
            <div className="space-y-2">
              <Label>Schedule for (optional)</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => { setScheduleDate(e.target.value); setMarkSent(false); }}
                data-testid="input-schedule-date"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant={markSent ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => { setMarkSent(!markSent); setScheduleDate(""); }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark as Sent Now
              </Button>
              {(scheduleDate || schedulingTemplate?.scheduledAt || schedulingTemplate?.sentAt) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => { setScheduleDate(""); setMarkSent(false); }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulingTemplate(null)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={scheduleM.isPending} data-testid="btn-confirm-schedule">
              {scheduleM.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!statsTemplate} onOpenChange={(open) => !open && setStatsTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Engagement Stats</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground font-medium truncate">{statsTemplate?.title}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Recipients Sent</Label>
                <Input
                  type="number"
                  min="0"
                  value={sentCount}
                  onChange={(e) => setSentCount(e.target.value)}
                  placeholder="0"
                  data-testid="input-sent-count"
                />
              </div>
              <div className="space-y-2">
                <Label>Opened</Label>
                <Input
                  type="number"
                  min="0"
                  value={openCount}
                  onChange={(e) => setOpenCount(e.target.value)}
                  placeholder="0"
                  data-testid="input-open-count"
                />
              </div>
              <div className="space-y-2">
                <Label>Clicked</Label>
                <Input
                  type="number"
                  min="0"
                  value={clickCount}
                  onChange={(e) => setClickCount(e.target.value)}
                  placeholder="0"
                  data-testid="input-click-count"
                />
              </div>
            </div>
            {parseInt(sentCount) > 0 && (
              <div className="flex gap-6 p-3 rounded-lg bg-muted/50 text-sm text-center">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{formatRate(parseInt(openCount) || 0, parseInt(sentCount) || 0)}</p>
                  <p className="text-muted-foreground text-xs">Open Rate</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{formatRate(parseInt(clickCount) || 0, parseInt(sentCount) || 0)}</p>
                  <p className="text-muted-foreground text-xs">Click Rate</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsTemplate(null)}>Cancel</Button>
            <Button onClick={handleUpdateStats} disabled={statsM.isPending} data-testid="btn-confirm-stats">
              {statsM.isPending ? "Saving..." : "Save Stats"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
