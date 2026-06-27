import { Router, type IRouter } from "express";
import { db, captionsTable, savedCaptionsTable } from "@workspace/db";
import { eq, ilike, and, desc, sql, inArray } from "drizzle-orm";
import {
  ListCaptionsQueryParams,
  CreateCaptionBody,
  GetCaptionParams,
  SaveCaptionParams,
  SaveCaptionBody,
  GenerateCaptionBody,
} from "@workspace/api-zod";
import { generateCaptionsAI } from "../lib/ai";

const router: IRouter = Router();

router.get("/captions", async (req, res): Promise<void> => {
  const parsed = ListCaptionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { niche, tone, platform, type, search, page = 1, limit = 20 } = parsed.data;

  const conditions = [];
  if (niche) conditions.push(eq(captionsTable.niche, niche));
  if (tone) conditions.push(eq(captionsTable.tone, tone));
  if (platform) conditions.push(eq(captionsTable.platform, platform));
  if (type) conditions.push(eq(captionsTable.type, type));
  if (search) conditions.push(ilike(captionsTable.text, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * limit;

  const [captions, countResult] = await Promise.all([
    db.select().from(captionsTable).where(whereClause).orderBy(desc(captionsTable.usageCount)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(captionsTable).where(whereClause),
  ]);

  const savedSet = new Set<number>();
  const saved = await db.select().from(savedCaptionsTable).where(eq(savedCaptionsTable.sellerRef, "default"));
  saved.forEach((s) => savedSet.add(s.captionId));

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  res.json({
    captions: captions.map((c) => ({ ...c, isSaved: savedSet.has(c.id) })),
    total,
    page,
    totalPages,
  });
});

router.post("/captions", async (req, res): Promise<void> => {
  const parsed = CreateCaptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [caption] = await db.insert(captionsTable).values(parsed.data).returning();
  res.status(201).json({ ...caption, isSaved: false });
});

router.get("/captions/popular", async (_req, res): Promise<void> => {
  const captions = await db.select().from(captionsTable).orderBy(desc(captionsTable.usageCount)).limit(10);
  const saved = await db.select().from(savedCaptionsTable).where(eq(savedCaptionsTable.sellerRef, "default"));
  const savedSet = new Set(saved.map((s) => s.captionId));
  res.json(captions.map((c) => ({ ...c, isSaved: savedSet.has(c.id) })));
});

router.get("/captions/niches", async (_req, res): Promise<void> => {
  const niches = await db
    .select({ niche: captionsTable.niche, count: sql<number>`count(*)` })
    .from(captionsTable)
    .groupBy(captionsTable.niche)
    .orderBy(desc(sql`count(*)`));
  res.json(niches.map((n) => ({ niche: n.niche, count: Number(n.count) })));
});

router.post("/captions/generate", async (req, res): Promise<void> => {
  const parsed = GenerateCaptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const captions = await generateCaptionsAI(parsed.data);
  res.json({ captions });
});

router.get("/captions/saved", async (_req, res): Promise<void> => {
  const saved = await db.select().from(savedCaptionsTable).where(eq(savedCaptionsTable.sellerRef, "default"));
  const savedIds = saved.map((s) => s.captionId);
  if (savedIds.length === 0) {
    res.json([]);
    return;
  }
  const captions = await db.select().from(captionsTable).where(inArray(captionsTable.id, savedIds));
  res.json(captions.map((c) => ({ ...c, isSaved: true })));
});

router.get("/captions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCaptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [caption] = await db.select().from(captionsTable).where(eq(captionsTable.id, params.data.id));
  if (!caption) {
    res.status(404).json({ error: "Caption not found" });
    return;
  }
  const [saved] = await db
    .select()
    .from(savedCaptionsTable)
    .where(and(eq(savedCaptionsTable.captionId, caption.id), eq(savedCaptionsTable.sellerRef, "default")));
  res.json({ ...caption, isSaved: !!saved });
});

router.post("/captions/:id/save", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SaveCaptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SaveCaptionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const captionId = params.data.id;
  const existing = await db
    .select()
    .from(savedCaptionsTable)
    .where(and(eq(savedCaptionsTable.captionId, captionId), eq(savedCaptionsTable.sellerRef, "default")));

  if (body.data.save && existing.length === 0) {
    const [saved] = await db.insert(savedCaptionsTable).values({ captionId, sellerRef: "default" }).returning();
    await db.update(captionsTable).set({ usageCount: sql`${captionsTable.usageCount} + 1` }).where(eq(captionsTable.id, captionId));
    res.json(saved);
    return;
  }

  if (!body.data.save && existing.length > 0) {
    await db.delete(savedCaptionsTable).where(eq(savedCaptionsTable.id, existing[0].id));
  }

  res.json({ id: 0, captionId, createdAt: new Date().toISOString() });
});

export default router;
