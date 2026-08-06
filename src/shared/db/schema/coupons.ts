import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";

export const coupon = pgTable(
  "coupon",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountType: text("discount_type", { enum: ["percentage", "fixed"] })
      .notNull()
      .default("percentage"),
    // percentage: 0-100; fixed: whole-number currency amount
    discountValue: integer("discount_value").notNull(),
    minOrderAmount: integer("min_order_amount").notNull().default(0),
    maxRedemptions: integer("max_redemptions"), // null = unlimited
    redemptionCount: integer("redemption_count").notNull().default(0),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("coupon_organizationId_idx").on(table.shopId),
    unique("coupon_organizationId_code_unique").on(table.shopId, table.code),
  ],
);

export const couponRelations = relations(coupon, ({ one }) => ({
  shop: one(shop, { fields: [coupon.shopId], references: [shop.id] }),
}));
