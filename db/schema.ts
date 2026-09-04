import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const businessSnapshots = sqliteTable("business_snapshots", {
  id: integer("id").primaryKey(),
  revenue: real("revenue").notNull(),
  orders: integer("orders").notNull(),
  netProfit: real("net_profit").notNull(),
  rating: real("rating").notNull(),
  revenueChange: real("revenue_change").notNull(),
  ordersChange: real("orders_change").notNull(),
  profitChange: real("profit_change").notNull(),
  ratingChange: real("rating_change").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const recommendations = sqliteTable("recommendations", {
  id: text("id").primaryKey(),
  agent: text("agent").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  impact: text("impact").notNull(),
  confidence: integer("confidence").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("pending"),
  source: text("source").notNull().default("agent"),
  createdAt: text("created_at").notNull(),
  actionedAt: text("actioned_at"),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agent: text("agent").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const integrations = sqliteTable("integrations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("demo"),
  lastSyncAt: text("last_sync_at"),
});
