import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListCaptions,
  useListCaptionNiches,
  useGetPopularCaptions,
  useListSavedCaptions,
  useSaveCaption,
  getListCaptionsQueryKey,
  getListSavedCaptionsQueryKey,
  getGetPopularCaptionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Sparkles, Bookmark, BookmarkCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NICHES = ["Fashion", "Hair", "Food", "Jewellery", "Beauty", "Electronics"];
const TONES = ["Funny", "Luxury", "Urgent", "Emotional", "Promotional", "Storytelling", "Educational"];
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "WhatsApp"];
const TYPES = ["New Arrival", "Flash Sale", "Restock", "Testimonial", "Promotional"];

function CaptionCard({ caption, onSave }: { caption: any; onSave: (id: number, save: boolean) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(caption.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group relative hover:shadow-md transition-all duration-200 border-border/60" data-testid={`caption-card-${caption.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-2 flex-wrap mb-3">
          <Badge variant="secondary" className="text-xs">{caption.niche}</Badge>
          <Badge variant="outline" className="text-xs">{caption.platform}</Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">{caption.tone}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line line-clamp-6">{caption.text}</p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">{caption.usageCount} uses</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onSave(caption.id, !caption.isSaved)}
              data-testid={`btn-save-caption-${caption.id}`}
            >
              {caption.isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant={copied ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={handleCopy}
              data-testid={`btn-copy-caption-${caption.id}`}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Captions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [platform, setPlatform] = useState("");

  const params = {
    ...(search && { search }),
    ...(niche && { niche }),
    ...(tone && { tone }),
    ...(platform && { platform }),
  };

  const { data: listData, isLoading } = useListCaptions(params, {
    query: { queryKey: getListCaptionsQueryKey(params) },
  });
  const { data: popular, isLoading: popularLoading } = useGetPopularCaptions({
    query: { queryKey: getGetPopularCaptionsQueryKey() },
  });
  const { data: saved, isLoading: savedLoading } = useListSavedCaptions({
    query: { queryKey: getListSavedCaptionsQueryKey() },
  });

  const saveCaption = useSaveCaption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCaptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSavedCaptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPopularCaptionsQueryKey() });
      },
    },
  });

  const handleSave = (id: number, save: boolean) => {
    saveCaption.mutate({ id, data: { save } }, {
      onSuccess: () => toast({ title: save ? "Caption saved!" : "Caption removed" }),
    });
  };

  const clearFilters = () => {
    setSearch(""); setNiche(""); setTone(""); setPlatform("");
  };

  const hasFilters = search || niche || tone || platform;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caption Library</h1>
          <p className="text-muted-foreground mt-1">Hundreds of professionally written captions ready to copy.</p>
        </div>
        <Button onClick={() => setLocation("/captions/generate")} className="gap-2" data-testid="btn-generate-captions">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search captions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-captions"
          />
        </div>
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger className="w-[150px]" data-testid="select-niche"><SelectValue placeholder="Niche" /></SelectTrigger>
          <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="w-[140px]" data-testid="select-tone"><SelectValue placeholder="Tone" /></SelectTrigger>
          <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[150px]" data-testid="select-platform"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground" data-testid="btn-clear-filters">Clear</Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList data-testid="tabs-captions">
          <TabsTrigger value="all">All Captions ({listData?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="saved">Saved ({saved?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listData?.captions.map((c) => <CaptionCard key={c.id} caption={c} onSave={handleSave} />)}
              {listData?.captions.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium">No captions found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or generate new ones with AI</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          {popularLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular?.map((c) => <CaptionCard key={c.id} caption={c} onSave={handleSave} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          {savedLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : saved?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No saved captions yet</p>
              <p className="text-sm mt-1">Bookmark captions you love for quick access</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {saved?.map((c) => <CaptionCard key={c.id} caption={c} onSave={handleSave} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
