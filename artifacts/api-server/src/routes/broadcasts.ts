import { Router, type IRouter } from "express";
import { db, broadcastTemplatesTable } from "@workspace/db";
import { eq, ilike, and, desc, isNull, isNotNull } from "drizzle-orm";
import {
  ListBroadcastsQueryParams,
  CreateBroadcastBody,
  GetBroadcastParams,
  GenerateBroadcastBody,
  UpdateBroadcastStatsParams,
  UpdateBroadcastStatsBody,
  ScheduleBroadcastParams,
  ScheduleBroadcastBody,
} from "@workspace/api-zod";
import { generateBroadcastAI } from "../lib/ai";

const router: IRouter = Router();

router.get("/broadcasts", async (req, res): Promise<void> => {
  const parsed = ListBroadcastsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, niche, search } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(broadcastTemplatesTable.category, category));
  if (niche) conditions.push(eq(broadcastTemplatesTable.niche, niche));
  if (search) conditions.push(ilike(broadcastTemplatesTable.message, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const templates = await db.select().from(broadcastTemplatesTable).where(whereClause).orderBy(desc(broadcastTemplatesTable.usageCount));
  res.json(templates);
});

router.post("/broadcasts", async (req, res): Promise<void> => {
  const parsed = CreateBroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [template] = await db.insert(broadcastTemplatesTable).values(parsed.data).returning();
  res.status(201).json(template);
});

router.post("/broadcasts/generate", async (req, res): Promise<void> => {
  const parsed = GenerateBroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await generateBroadcastAI(parsed.data);
  res.json(result);
});

router.get("/broadcasts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBroadcastParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [template] = await db.select().from(broadcastTemplatesTable).where(eq(broadcastTemplatesTable.id, params.data.id));
  if (!template) {
    res.status(404).json({ error: "Broadcast template not found" });
    return;
  }
  res.json(template);
});

router.patch("/broadcasts/:id/stats", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBroadcastStatsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBroadcastStatsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [template] = await db
    .update(broadcastTemplatesTable)
    .set({ sentCount: parsed.data.sentCount, openCount: parsed.data.openCount, clickCount: parsed.data.clickCount })
    .where(eq(broadcastTemplatesTable.id, params.data.id))
    .returning();

  if (!template) {
    res.status(404).json({ error: "Broadcast template not found" });
    return;
  }
  res.json(template);
});

router.patch("/broadcasts/:id/schedule", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ScheduleBroadcastParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ScheduleBroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof broadcastTemplatesTable.$inferInsert> = {};
  if ("scheduledAt" in parsed.data) updateData.scheduledAt = parsed.data.scheduledAt ?? undefined;
  if ("sentAt" in parsed.data) updateData.sentAt = parsed.data.sentAt ?? undefined;
  if (parsed.data.sentAt) updateData.usageCount = 1;

  const [template] = await db
    .update(broadcastTemplatesTable)
    .set(updateData)
    .where(eq(broadcastTemplatesTable.id, params.data.id))
    .returning();

  if (!template) {
    res.status(404).json({ error: "Broadcast template not found" });
    return;
  }
  res.json(template);
});

export default router;
