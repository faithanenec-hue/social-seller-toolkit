import { pgTable, text, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { captionsTable } from "./captions";

export const captionCollectionsTable = pgTable("caption_collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const captionCollectionItemsTable = pgTable("caption_collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => captionCollectionsTable.id, { onDelete: "cascade" }),
  captionId: integer("caption_id").notNull().references(() => captionsTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("uniq_collection_caption").on(t.collectionId, t.captionId),
]);

export const insertCaptionCollectionSchema = createInsertSchema(captionCollectionsTable).omit({ id: true, createdAt: true });
export type InsertCaptionCollection = z.infer<typeof insertCaptionCollectionSchema>;
export type CaptionCollection = typeof captionCollectionsTable.$inferSelect;

export const insertCaptionCollectionItemSchema = createInsertSchema(captionCollectionItemsTable).omit({ id: true, addedAt: true });
export type InsertCaptionCollectionItem = z.infer<typeof insertCaptionCollectionItemSchema>;
export type CaptionCollectionItem = typeof captionCollectionItemsTable.$inferSelect;
