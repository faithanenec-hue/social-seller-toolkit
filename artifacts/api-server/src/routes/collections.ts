import { Router, type IRouter } from "express";
import { db, captionCollectionsTable, captionCollectionItemsTable, captionsTable, savedCaptionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateCollectionBody,
  UpdateCollectionBody,
  GetCollectionParams,
  UpdateCollectionParams,
  DeleteCollectionParams,
  AddCaptionToCollectionBody,
  AddCaptionToCollectionParams,
  RemoveCaptionFromCollectionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/collections", async (_req, res): Promise<void> => {
  const collections = await db
    .select({
      id: captionCollectionsTable.id,
      name: captionCollectionsTable.name,
      description: captionCollectionsTable.description,
      captionCount: sql<number>`count(${captionCollectionItemsTable.id})`,
      createdAt: captionCollectionsTable.createdAt,
    })
    .from(captionCollectionsTable)
    .leftJoin(captionCollectionItemsTable, eq(captionCollectionItemsTable.collectionId, captionCollectionsTable.id))
    .groupBy(captionCollectionsTable.id)
    .orderBy(captionCollectionsTable.createdAt);

  res.json(collections.map((c) => ({ ...c, captionCount: Number(c.captionCount) })));
});

router.post("/collections", async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [collection] = await db.insert(captionCollectionsTable).values(parsed.data).returning();
  res.status(201).json({ ...collection, captionCount: 0 });
});

router.get("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCollectionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [collection] = await db.select().from(captionCollectionsTable).where(eq(captionCollectionsTable.id, params.data.id));
  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const savedCaptionIds = await db.select({ captionId: savedCaptionsTable.captionId }).from(savedCaptionsTable);
  const savedIds = new Set(savedCaptionIds.map((s) => s.captionId));

  const items = await db
    .select({ caption: captionsTable })
    .from(captionCollectionItemsTable)
    .innerJoin(captionsTable, eq(captionCollectionItemsTable.captionId, captionsTable.id))
    .where(eq(captionCollectionItemsTable.collectionId, params.data.id));

  res.json({
    ...collection,
    captions: items.map(({ caption }) => ({ ...caption, isSaved: savedIds.has(caption.id) })),
  });
});

router.patch("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCollectionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [collection] = await db.update(captionCollectionsTable).set(parsed.data).where(eq(captionCollectionsTable.id, params.data.id)).returning();
  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(captionCollectionItemsTable)
    .where(eq(captionCollectionItemsTable.collectionId, params.data.id));

  res.json({ ...collection, captionCount: Number(countResult?.count ?? 0) });
});

router.delete("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCollectionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(captionCollectionsTable).where(eq(captionCollectionsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/collections/:id/captions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddCaptionToCollectionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddCaptionToCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(captionCollectionItemsTable)
    .where(and(eq(captionCollectionItemsTable.collectionId, params.data.id), eq(captionCollectionItemsTable.captionId, parsed.data.captionId)));

  if (existing.length > 0) {
    res.status(409).json({ error: "Caption already in collection" });
    return;
  }

  const [item] = await db.insert(captionCollectionItemsTable).values({ collectionId: params.data.id, captionId: parsed.data.captionId }).returning();
  res.status(201).json(item);
});

router.delete("/collections/:id/captions/:captionId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawCaptionId = Array.isArray(req.params.captionId) ? req.params.captionId[0] : req.params.captionId;
  const params = RemoveCaptionFromCollectionParams.safeParse({ id: parseInt(rawId, 10), captionId: parseInt(rawCaptionId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(captionCollectionItemsTable)
    .where(and(eq(captionCollectionItemsTable.collectionId, params.data.id), eq(captionCollectionItemsTable.captionId, params.data.captionId)));
  res.sendStatus(204);
});

export default router;
