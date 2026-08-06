import { relations } from "drizzle-orm";
import { pgTable, text, integer, index, unique } from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";
import { product } from "./products";

// A cart is scoped to ONE shop, matching how the storefront itself is
// per-shop (/{slug}) rather than a cross-shop marketplace cart. Keyed by
// exactly one of buyerClerkUserId (signed-in buyer) or guestId (a long-lived
// cookie, minted lazily on first add-to-cart) — never both.
//
// The unique constraints below only bite when the column is actually set:
// Postgres treats NULLs as distinct for uniqueness, so a guest cart's NULL
// buyerClerkUserId doesn't collide with anything, and vice versa. That's
// exactly what we want — "one cart per shop per signed-in buyer" and
// "one cart per shop per guest" are each enforced independently.
export const cart = pgTable(
  "cart",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    buyerClerkUserId: text("buyer_clerk_user_id"),
    guestId: text("guest_id"),
    ...timestamps,
  },
  (table) => [
    index("cart_organizationId_idx").on(table.shopId),
    unique("cart_organization_buyer_unique").on(table.shopId, table.buyerClerkUserId),
    unique("cart_organization_guest_unique").on(table.shopId, table.guestId),
  ],
);

// No price snapshot here on purpose — a cart isn't a completed transaction,
// so it always reflects the product's current price/stock. Price gets
// snapshotted onto sale_item.unitPrice only once checkout actually happens.
export const cartItem = pgTable(
  "cart_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cartId: text("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("cartItem_cartId_idx").on(table.cartId),
    unique("cartItem_cart_product_unique").on(table.cartId, table.productId),
  ],
);

export const cartRelations = relations(cart, ({ one, many }) => ({
  shop: one(shop, { fields: [cart.shopId], references: [shop.id] }),
  items: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, { fields: [cartItem.cartId], references: [cart.id] }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id],
  }),
}));
