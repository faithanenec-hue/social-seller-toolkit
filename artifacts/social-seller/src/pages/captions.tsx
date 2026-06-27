import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListCaptions,
  useListCaptionNiches,
  useGetPopularCaptions,
  useListSavedCaptions,
  useSaveCaption,
  useCreateCaption,
  useListCollections,
  useCreateCollection,
  useGetCollection,
  useUpdateCollection,
  useDeleteCollection,
  useAddCaptionToCollection,
  useRemoveCaptionFromCollection,
  getListCaptionsQueryKey,
  getListSavedCaptionsQueryKey,
  getGetPopularCaptionsQueryKey,
  getListCollectionsQueryKey,
  getGetCollectionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Copy, Check, Sparkles, Bookmark, BookmarkCheck, Search,
  FolderPlus, Plus, FolderOpen, Trash2, ChevronLeft, Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NICHES = ["Fashion", "Hair", "Food", "Jewellery", "Beauty", "Electronics"];
const TONES = ["Funny", "Luxury", "Urgent", "Emotional", "Promotional", "Storytelling", "Educational"];
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "WhatsApp"];
const TYPES = ["New Arrival", "Flash Sale", "Restock", "Testimonial", "Promotional"];
const CATEGORIES = ["Social Media", "Product Launch", "Sale", "Engagement", "Brand", "Educational"];

function CaptionCard({
  caption,
  onSave,
  onAddToCollection,
}: {
  caption: any;
  onSave: (id: number, save: boolean) => void;
  onAddToCollection?: (caption: any) => void;
}) {
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
          <div className="flex gap-1">
            {onAddToCollection && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onAddToCollection(caption)}
                title="Add to collection"
              >
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
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

  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newText, setNewText] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newTone, setNewTone] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [newType, setNewType] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDesc, setCollectionDesc] = useState("");

  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  const [addToCollectionCaption, setAddToCollectionCaption] = useState<any | null>(null);
  const [targetCollectionId, setTargetCollectionId] = useState<string>("");

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
  const { data: collections, isLoading: collectionsLoading } = useListCollections({
    query: { queryKey: getListCollectionsQueryKey() },
  });
  const { data: selectedCollection, isLoading: collectionDetailLoading } = useGetCollection(
    selectedCollectionId ?? 0,
    {
      query: {
        queryKey: getGetCollectionQueryKey(selectedCollectionId ?? 0),
        enabled: selectedCollectionId !== null,
      },
    }
  );

  const saveCaption = useSaveCaption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCaptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSavedCaptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPopularCaptionsQueryKey() });
      },
    },
  });

  const createCaption = useCreateCaption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCaptionsQueryKey() });
        setShowCreateTemplate(false);
        resetTemplateForm();
        toast({ title: "Template created!" });
      },
    },
  });

  const createCollection = useCreateCollection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
        setShowCreateCollection(false);
        setCollectionName("");
        setCollectionDesc("");
        toast({ title: "Collection created!" });
      },
    },
  });

  const deleteCollection = useDeleteCollection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
        setSelectedCollectionId(null);
        toast({ title: "Collection deleted" });
      },
    },
  });

  const addToCollection = useAddCaptionToCollection({
    mutation: {
      onSuccess: () => {
        if (selectedCollectionId) {
          queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey(selectedCollectionId) });
        }
        queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
        setAddToCollectionCaption(null);
        setTargetCollectionId("");
        toast({ title: "Added to collection!" });
      },
      onError: () => {
        toast({ title: "Caption already in that collection", variant: "destructive" });
      },
    },
  });

  const removeFromCollection = useRemoveCaptionFromCollection({
    mutation: {
      onSuccess: () => {
        if (selectedCollectionId) {
          queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey(selectedCollectionId) });
          queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
        }
        toast({ title: "Removed from collection" });
      },
    },
  });

  const handleSave = (id: number, save: boolean) => {
    saveCaption.mutate({ id, data: { save } }, {
      onSuccess: () => toast({ title: save ? "Caption saved!" : "Caption removed" }),
    });
  };

  const resetTemplateForm = () => {
    setNewText(""); setNewNiche(""); setNewTone(""); setNewPlatform(""); setNewType(""); setNewCategory("");
  };

  const handleCreateTemplate = () => {
    if (!newText || !newNiche || !newTone || !newPlatform || !newType || !newCategory) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createCaption.mutate({ data: { text: newText, niche: newNiche, tone: newTone, platform: newPlatform, type: newType, category: newCategory } });
  };

  const handleCreateCollection = () => {
    if (!collectionName) {
      toast({ title: "Please enter a collection name", variant: "destructive" });
      return;
    }
    createCollection.mutate({ data: { name: collectionName, ...(collectionDesc && { description: collectionDesc }) } });
  };

  const handleAddToCollection = () => {
    if (!addToCollectionCaption || !targetCollectionId) return;
    addToCollection.mutate({ id: parseInt(targetCollectionId), data: { captionId: addToCollectionCaption.id } });
  };

  const clearFilters = () => { setSearch(""); setNiche(""); setTone(""); setPlatform(""); };
  const hasFilters = search || niche || tone || platform;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caption Library</h1>
          <p className="text-muted-foreground mt-1">Hundreds of professionally written captions ready to copy.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateTemplate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
          <Button onClick={() => setLocation("/captions/generate")} className="gap-2" data-testid="btn-generate-captions">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>
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
          <TabsTrigger value="collections">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Collections ({collections?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listData?.captions.map((c) => (
                <CaptionCard
                  key={c.id}
                  caption={c}
                  onSave={handleSave}
                  onAddToCollection={(cap) => { setAddToCollectionCaption(cap); setTargetCollectionId(""); }}
                />
              ))}
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
              {popular?.map((c) => (
                <CaptionCard
                  key={c.id}
                  caption={c}
                  onSave={handleSave}
                  onAddToCollection={(cap) => { setAddToCollectionCaption(cap); setTargetCollectionId(""); }}
                />
              ))}
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
              {saved?.map((c) => (
                <CaptionCard
                  key={c.id}
                  caption={c}
                  onSave={handleSave}
                  onAddToCollection={(cap) => { setAddToCollectionCaption(cap); setTargetCollectionId(""); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          {selectedCollectionId !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCollectionId(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  All Collections
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={() => { if (selectedCollectionId) deleteCollection.mutate({ id: selectedCollectionId }); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Collection
                </Button>
              </div>
              {collectionDetailLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
              ) : selectedCollection ? (
                <>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCollection.name}</h2>
                    {selectedCollection.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedCollection.description}</p>
                    )}
                  </div>
                  {selectedCollection.captions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">This collection is empty</p>
                      <p className="text-sm mt-1">Add captions using the folder icon on any caption card</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedCollection.captions.map((c: any) => (
                        <div key={c.id} className="relative">
                          <CaptionCard caption={c} onSave={handleSave} />
                          <button
                            className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                            title="Remove from collection"
                            onClick={() => {
                              if (selectedCollectionId) {
                                removeFromCollection.mutate({ id: selectedCollectionId, captionId: c.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowCreateCollection(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Collection
                </Button>
              </div>
              {collectionsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
              ) : collections?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No collections yet</p>
                  <p className="text-sm mt-1">Create a collection to organise your favourite captions</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {collections?.map((col) => (
                    <Card
                      key={col.id}
                      className="cursor-pointer hover:shadow-md transition-all border-border/60 hover:border-primary/30"
                      onClick={() => setSelectedCollectionId(col.id)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-primary" />
                          {col.name}
                        </CardTitle>
                        {col.description && (
                          <CardDescription className="text-xs">{col.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{col.captionCount} caption{col.captionCount !== 1 ? "s" : ""}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Caption Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Caption Text <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Write your caption here..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Niche <span className="text-destructive">*</span></Label>
                <Select value={newNiche} onValueChange={setNewNiche}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone <span className="text-destructive">*</span></Label>
                <Select value={newTone} onValueChange={setNewTone}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform <span className="text-destructive">*</span></Label>
                <Select value={newPlatform} onValueChange={setNewPlatform}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateTemplate(false); resetTemplateForm(); }}>Cancel</Button>
            <Button onClick={handleCreateTemplate} disabled={createCaption.isPending}>
              {createCaption.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog */}
      <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Collection Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Flash Sale Captions"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="What is this collection for?"
                value={collectionDesc}
                onChange={(e) => setCollectionDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCollection(false)}>Cancel</Button>
            <Button onClick={handleCreateCollection} disabled={createCollection.isPending}>
              {createCollection.isPending ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Collection Dialog */}
      <Dialog open={!!addToCollectionCaption} onOpenChange={(open) => !open && setAddToCollectionCaption(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground line-clamp-2">{addToCollectionCaption?.text}</p>
            {collections?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No collections yet.</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => { setAddToCollectionCaption(null); setShowCreateCollection(true); }}
                >
                  Create your first collection →
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Choose a collection</Label>
                <Select value={targetCollectionId} onValueChange={setTargetCollectionId}>
                  <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                  <SelectContent>
                    {collections?.map((col) => (
                      <SelectItem key={col.id} value={String(col.id)}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToCollectionCaption(null)}>Cancel</Button>
            {collections && collections.length > 0 && (
              <Button onClick={handleAddToCollection} disabled={!targetCollectionId || addToCollection.isPending}>
                {addToCollection.isPending ? "Adding..." : "Add to Collection"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
