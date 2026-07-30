import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";
import { sale } from "./sales";

export const customer = pgTable(
  "customer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("shop_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    buyerClerkUserId: text("buyer_clerk_user_id"),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    customerType: text("customer_type", { enum: ["individual", "business"] })
      .notNull()
      .default("individual"),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("customer_shopId_idx").on(table.shopId),
    index("customer_name_idx").on(table.name),
    index("customer_email_idx").on(table.email),
    index("customer_buyerClerkUserId_idx").on(table.buyerClerkUserId),
  ],
);

export const customerRelations = relations(customer, ({ one, many }) => ({
  shop: one(shop, { fields: [customer.shopId], references: [shop.id] }),
  sales: many(sale),
}));
