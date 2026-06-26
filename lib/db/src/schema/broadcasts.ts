import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const broadcastTemplatesTable = pgTable("broadcast_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(),
  niche: text("niche").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBroadcastTemplateSchema = createInsertSchema(broadcastTemplatesTable).omit({ id: true, createdAt: true, usageCount: true });
export type InsertBroadcastTemplate = z.infer<typeof insertBroadcastTemplateSchema>;
export type BroadcastTemplate = typeof broadcastTemplatesTable.$inferSelect;
