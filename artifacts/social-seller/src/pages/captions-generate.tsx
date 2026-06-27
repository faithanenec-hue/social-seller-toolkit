import { useState } from "react";
import { useGenerateCaption } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Copy, Check, RefreshCw, ChevronLeft, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const NICHES = ["Fashion", "Hair", "Food", "Jewellery", "Beauty", "Electronics"];
const TONES = ["Funny", "Luxury", "Urgent", "Emotional", "Promotional", "Storytelling", "Educational"];
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "WhatsApp"];
const GOALS = ["Drive Sales", "Build Awareness", "Announce New Arrival", "Flash Sale", "Restock Alert", "Holiday Promotion"];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-pink-100 text-pink-700 border-pink-200",
  Facebook: "bg-blue-100 text-blue-700 border-blue-200",
  TikTok: "bg-slate-100 text-slate-700 border-slate-200",
  WhatsApp: "bg-green-100 text-green-700 border-green-200",
};

export default function CaptionsGenerate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [productName, setProductName] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [goal, setGoal] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["Instagram", "WhatsApp"]);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const generate = useGenerateCaption();

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleGenerate = () => {
    if (!productName || !niche || !tone || !goal || platforms.length === 0) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    generate.mutate(
      { data: { productName, niche, tone, promotionGoal: goal, platforms } },
      {
        onSuccess: (data) => {
          if (data.captions.length > 0) {
            toast({ title: `${data.captions.length} caption${data.captions.length > 1 ? "s" : ""} generated!` });
          }
        },
        onError: (err) => {
          toast({
            title: "Generation failed",
            description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCopy = (platform: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
    toast({ title: `${platform} caption copied!` });
  };

  const results = generate.data?.captions ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <button onClick={() => setLocation("/captions")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Library
        </button>
        <h1 className="text-3xl font-bold tracking-tight">AI Caption Generator</h1>
        <p className="text-muted-foreground mt-1">Generate platform-specific captions in seconds.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Caption Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product / Service Name</Label>
              <Input
                id="product-name"
                placeholder="e.g. Brazilian Body Wave Wig"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                data-testid="input-product-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Business Niche</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger data-testid="select-niche-generate"><SelectValue placeholder="Select your niche" /></SelectTrigger>
                <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Caption Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger data-testid="select-tone-generate"><SelectValue placeholder="Select tone" /></SelectTrigger>
                <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Promotion Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger data-testid="select-goal-generate"><SelectValue placeholder="What's the goal?" /></SelectTrigger>
                <SelectContent>{GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <Checkbox
                      id={`platform-${p}`}
                      checked={platforms.includes(p)}
                      onCheckedChange={() => togglePlatform(p)}
                      data-testid={`checkbox-platform-${p}`}
                    />
                    <label htmlFor={`platform-${p}`} className="text-sm cursor-pointer">{p}</label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={generate.isPending}
              data-testid="btn-generate"
            >
              {generate.isPending ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4" />Generate Captions</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {generate.isPending && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Sparkles className="h-8 w-8 animate-pulse mb-3 text-primary" />
              <p className="font-medium">Crafting your captions...</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Generated Captions</h2>
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="gap-1 text-muted-foreground" data-testid="btn-regenerate">
                  <RefreshCw className="h-3.5 w-3.5" />Regenerate
                </Button>
              </div>
              {results.map((result) => (
                <Card key={result.platform} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`text-xs border ${PLATFORM_COLORS[result.platform] ?? ""}`} variant="outline">
                        {result.platform}
                      </Badge>
                      <Button
                        size="sm"
                        variant={copiedPlatform === result.platform ? "default" : "outline"}
                        className="gap-1.5 text-xs h-8"
                        onClick={() => handleCopy(result.platform, result.text)}
                        data-testid={`btn-copy-${result.platform}`}
                      >
                        {copiedPlatform === result.platform ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedPlatform === result.platform ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{result.text}</p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {generate.isError && (
            <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-destructive/30 rounded-xl bg-destructive/5">
              <AlertCircle className="h-8 w-8 mb-3 text-destructive opacity-70" />
              <p className="font-medium text-destructive">Generation failed</p>
              <p className="text-sm mt-1 text-muted-foreground max-w-xs">
                {generate.error instanceof Error ? generate.error.message : "Something went wrong. Please try again."}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleGenerate}>
                Try again
              </Button>
            </div>
          )}

          {!generate.isPending && !generate.isError && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <Sparkles className="h-8 w-8 mb-3 opacity-30" />
              <p className="font-medium">Your captions will appear here</p>
              <p className="text-sm mt-1">Fill in the form and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
