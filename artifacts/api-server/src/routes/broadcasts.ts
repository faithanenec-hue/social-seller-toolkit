import { Router, type IRouter } from "express";
import { db, broadcastTemplatesTable } from "@workspace/db";
import { eq, ilike, and, desc } from "drizzle-orm";
import {
  ListBroadcastsQueryParams,
  CreateBroadcastBody,
  GetBroadcastParams,
  GenerateBroadcastBody,
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

export default router;
