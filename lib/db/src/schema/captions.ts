import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const captionsTable = pgTable("captions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  niche: text("niche").notNull(),
  tone: text("tone").notNull(),
  platform: text("platform").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedCaptionsTable = pgTable("saved_captions", {
  id: serial("id").primaryKey(),
  captionId: integer("caption_id").notNull().references(() => captionsTable.id),
  sellerRef: text("seller_ref").notNull().default("default"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaptionSchema = createInsertSchema(captionsTable).omit({ id: true, createdAt: true, usageCount: true });
export type InsertCaption = z.infer<typeof insertCaptionSchema>;
export type Caption = typeof captionsTable.$inferSelect;

export const insertSavedCaptionSchema = createInsertSchema(savedCaptionsTable).omit({ id: true, createdAt: true });
export type InsertSavedCaption = z.infer<typeof insertSavedCaptionSchema>;
export type SavedCaption = typeof savedCaptionsTable.$inferSelect;
