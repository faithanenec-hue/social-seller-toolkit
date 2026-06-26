import { useListWishlist, getListWishlistQueryKey, getRemoveFromWishlistMutationOptions } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PortalWishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useListWishlist({
    query: { queryKey: getListWishlistQueryKey() },
  });

  const removeItem = useMutation({
    ...getRemoveFromWishlistMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListWishlistQueryKey() });
      toast({ title: "Removed from wishlist" });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground mt-1">Products you've saved for later.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : items?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Your wishlist is empty</p>
          <p className="text-sm mt-1">Products you save will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-all border-border/60" data-testid={`wishlist-item-${item.id}`}>
              {item.product.imageUrl && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.niche}</p>
                  </div>
                  <p className="text-base font-bold text-primary shrink-0">${Number(item.product.price).toFixed(2)}</p>
                </div>
                {item.product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.product.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem.mutate({ id: item.id })}
                    data-testid={`btn-remove-wishlist-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
