import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyTable = pgTable("loyalty", {
  id: serial("id").primaryKey(),
  customerRef: text("customer_ref").notNull().unique().default("default"),
  points: integer("points").notNull().default(0),
  tier: text("tier").notNull().default("bronze"),
  totalSpent: numeric("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  referralCode: text("referral_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLoyaltySchema = createInsertSchema(loyaltyTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoyalty = z.infer<typeof insertLoyaltySchema>;
export type Loyalty = typeof loyaltyTable.$inferSelect;
