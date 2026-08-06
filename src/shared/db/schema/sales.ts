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
import { customer } from "./customers";

// Two ways a sale gets created: manually here in the dashboard (for sales
// not made through the storefront), or automatically once Checkout exists
// and a buyer completes a purchase — see the recordSale() note in
// features/sales/server/actions.ts for how that hooks in.

export const sale = pgTable(
  "sale",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    saleNumber: text("sale_number").notNull(),
    customerId: text("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name").notNull(),
    saleDate: timestamp("sale_date").notNull(),
    paystackReference: text("paystack_reference").unique(),
    totalAmount: integer("total_amount").notNull().default(0),
    balance: integer("balance").notNull().default(0),
    paymentStatus: text("payment_status", {
      enum: ["pending", "partial", "paid", "overdue", "cancelled"],
    })
      .notNull()
      .default("pending"),
    discountAmount: integer("discount_amount").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("sale_organizationId_idx").on(table.shopId),
    index("sale_customerId_idx").on(table.customerId),
    index("sale_saleDate_idx").on(table.saleDate),
    index("sale_paymentStatus_idx").on(table.paymentStatus),
    unique("sale_organizationId_saleNumber_unique").on(table.shopId, table.saleNumber),
  ],
);

export const saleItem = pgTable(
  "sale_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    saleId: text("sale_id")
      .notNull()
      .references(() => sale.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => product.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    productCode: text("product_code"),
    productSku: text("product_sku").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    subtotal: integer("subtotal").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("saleItem_saleId_idx").on(table.saleId),
    index("saleItem_productId_idx").on(table.productId),
  ],
);

export const saleRelations = relations(sale, ({ one, many }) => ({
  shop: one(shop, { fields: [sale.shopId], references: [shop.id] }),
  customer: one(customer, {
    fields: [sale.customerId],
    references: [customer.id],
  }),
  items: many(saleItem),
}));

export const saleItemRelations = relations(saleItem, ({ one }) => ({
  sale: one(sale, { fields: [saleItem.saleId], references: [sale.id] }),
  product: one(product, {
    fields: [saleItem.productId],
    references: [product.id],
  }),
}));
