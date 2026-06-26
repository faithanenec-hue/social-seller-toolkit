import { useState } from "react";
import { useLocation } from "wouter";
import { useGenerateBroadcast } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Check, RefreshCw, ChevronLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NICHES = ["Fashion", "Hair", "Food", "Jewellery", "Beauty", "Electronics"];
const PROMO_TYPES = ["Flash Sale", "New Arrival", "Restock", "Holiday Promotion", "Re-engagement", "Customer Appreciation", "Payment Reminder"];
const AUDIENCES = ["All Customers", "VIP Customers", "New Customers", "Inactive Customers", "Subscribers"];

export default function BroadcastsGenerate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [niche, setNiche] = useState("");
  const [promotionType, setPromotionType] = useState("");
  const [audience, setAudience] = useState("");
  const [discount, setDiscount] = useState("");
  const [productName, setProductName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useGenerateBroadcast();

  const handleGenerate = () => {
    if (!niche || !promotionType || !audience || !productName || !businessName) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    generate.mutate({
      data: {
        niche,
        promotionType,
        audience,
        discountPercentage: discount ? parseInt(discount) : null,
        productName,
        businessName,
      },
    });
  };

  const handleCopy = () => {
    if (!generate.data) return;
    navigator.clipboard.writeText(generate.data.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Broadcast message copied!" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <button onClick={() => setLocation("/broadcasts")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Library
        </button>
        <h1 className="text-3xl font-bold tracking-tight">AI Broadcast Generator</h1>
        <p className="text-muted-foreground mt-1">Create personalized WhatsApp broadcast messages instantly.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Broadcast Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Glam Hair Studio"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                data-testid="input-business-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Product / Service <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Brazilian Body Wave Bundles"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                data-testid="input-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Business Niche <span className="text-destructive">*</span></Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger data-testid="select-niche"><SelectValue placeholder="Select niche" /></SelectTrigger>
                <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Promotion Type <span className="text-destructive">*</span></Label>
              <Select value={promotionType} onValueChange={setPromotionType}>
                <SelectTrigger data-testid="select-promo-type"><SelectValue placeholder="Select promotion type" /></SelectTrigger>
                <SelectContent>{PROMO_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Audience <span className="text-destructive">*</span></Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger data-testid="select-audience"><SelectValue placeholder="Who is this for?" /></SelectTrigger>
                <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount % <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                type="number"
                placeholder="e.g. 20"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                max="100"
                data-testid="input-discount"
              />
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
                <><Sparkles className="h-4 w-4" />Generate Broadcast</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {generate.isPending && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MessageSquare className="h-8 w-8 animate-pulse mb-3 text-primary" />
              <p className="font-medium">Crafting your broadcast...</p>
            </div>
          )}

          {generate.data && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-primary">{generate.data.subject}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={handleGenerate} className="gap-1 text-xs" data-testid="btn-regenerate">
                      <RefreshCw className="h-3 w-3" />Redo
                    </Button>
                    <Button
                      size="sm"
                      variant={copied ? "default" : "outline"}
                      className="gap-1.5 text-xs"
                      onClick={handleCopy}
                      data-testid="btn-copy-broadcast"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied!" : "Copy Message"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-lg p-4 border border-border/50">
                  <p className="text-sm leading-relaxed whitespace-pre-line font-mono">{generate.data.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Ready to paste into WhatsApp Business broadcast</p>
              </CardContent>
            </Card>
          )}

          {!generate.isPending && !generate.data && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <MessageSquare className="h-8 w-8 mb-3 opacity-30" />
              <p className="font-medium">Your broadcast will appear here</p>
              <p className="text-sm mt-1">Fill in the form and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
