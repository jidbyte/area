import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";
import { product } from "./products";
import { saleItem } from "./sales";

// Reviews require a real purchase — saleItemId points at the specific
// sale_item that proved eligibility when the review was written (see
// getEligibleSaleItemForReview in features/reviews/server/queries.ts). Only
// signed-in buyers can review (not guests), since a review is public,
// durable content tied to an identity, unlike a private cart — so
// buyerClerkUserId is the author identity, matching how customer.
// buyerClerkUserId links a checkout-created record to a real Clerk account.
//
// One review per (product, buyer) — reviewing the same product again just
// edits the existing one, matching how most storefronts work (you review a
// PRODUCT once, not once per order).
export const review = pgTable(
  "review",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    saleItemId: text("sale_item_id")
      .notNull()
      .references(() => saleItem.id, { onDelete: "cascade" }),
    buyerClerkUserId: text("buyer_clerk_user_id").notNull(),
    buyerName: text("buyer_name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("review_organizationId_idx").on(table.shopId),
    index("review_productId_idx").on(table.productId),
    unique("review_product_buyer_unique").on(
      table.productId,
      table.buyerClerkUserId,
    ),
  ],
);

export const reviewRelations = relations(review, ({ one }) => ({
  shop: one(shop, { fields: [review.shopId], references: [shop.id] }),
  product: one(product, {
    fields: [review.productId],
    references: [product.id],
  }),
  saleItem: one(saleItem, {
    fields: [review.saleItemId],
    references: [saleItem.id],
  }),
}));
