import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, niche } = parsed.data;
  const conditions = [];
  if (niche) conditions.push(eq(productsTable.niche, niche));
  if (search) conditions.push(ilike(productsTable.title, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const products = await db.select().from(productsTable).where(whereClause);
  res.json(products.map((p) => ({ ...p, price: Number(p.price) })));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insertData = { ...parsed.data, price: String(parsed.data.price) };
  const [product] = await db.insert(productsTable).values(insertData).returning();
  res.status(201).json({ ...product, price: Number(product.price) });
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { price: rawPrice, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (rawPrice !== undefined) updateData.price = String(rawPrice);
  const [product] = await db.update(productsTable).set(updateData as any).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ ...product, price: Number(product.price) });
});

export default router;
