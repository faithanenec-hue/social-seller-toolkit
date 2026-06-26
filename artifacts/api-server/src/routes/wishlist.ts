import { Router, type IRouter } from "express";
import { db, wishlistItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddToWishlistBody, RemoveFromWishlistParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/wishlist", async (_req, res): Promise<void> => {
  const items = await db
    .select({
      id: wishlistItemsTable.id,
      createdAt: wishlistItemsTable.createdAt,
      product: {
        id: productsTable.id,
        title: productsTable.title,
        description: productsTable.description,
        price: productsTable.price,
        niche: productsTable.niche,
        imageUrl: productsTable.imageUrl,
        inStock: productsTable.inStock,
        createdAt: productsTable.createdAt,
      },
    })
    .from(wishlistItemsTable)
    .innerJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id))
    .where(eq(wishlistItemsTable.customerRef, "default"));

  res.json(items.map((i) => ({ ...i, product: { ...i.product, price: Number(i.product.price) } })));
});

router.post("/wishlist", async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(wishlistItemsTable).values({ productId: parsed.data.productId, customerRef: "default" }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
  res.status(201).json({ ...item, product: { ...product, price: Number(product.price) } });
});

router.delete("/wishlist/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFromWishlistParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
