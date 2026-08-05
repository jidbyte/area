import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

import { timestamps } from "./shop";
import { shop } from "./shop";
import { review } from "./reviews";

export const product = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("shop_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sku: text("sku").notNull().unique(),
    code: text("code").unique(),
    brand: text("brand"),
    model: text("model"),
    description: text("description"),
    quantity: integer("quantity").notNull().default(0),
    restockLevel: integer("restock_level").notNull().default(0),
    optimalLevel: integer("optimal_level").notNull().default(0),
    cost: integer("cost").notNull().default(0),
    price: integer("price").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("product_shopId_idx").on(table.shopId),
    index("product_name_idx").on(table.name),
    index("product_sku_idx").on(table.sku),
    index("product_isActive_idx").on(table.isActive),
  ],
);

export const category = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("shop_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    index("category_shopId_idx").on(table.shopId),
    index("category_name_idx").on(table.name),
  ],
);

export const image = pgTable(
  "image",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    url: text("url").notNull(),
    fileKey: text("file_key").notNull(), // Cloudflare R2 object key
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("image_productId_idx").on(table.productId),
    index("image_isPrimary_idx").on(table.isPrimary),
  ],
);

// m2m junction between products and categories
export const productCategory = pgTable(
  "product_category",
  {
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("productCategory_productId_idx").on(table.productId),
    index("productCategory_categoryId_idx").on(table.categoryId),
  ],
);

// New: audit trail for stock changes (not in either source project)
export const inventoryLog = pgTable(
  "inventory_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    actorClerkUserId: text("actor_clerk_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("inventoryLog_productId_idx").on(table.productId)],
);

/// Relations
export const productRelations = relations(product, ({ many, one }) => ({
  images: many(image),
  productCategories: many(productCategory),
  inventoryLogs: many(inventoryLog),
  reviews: many(review),
  shop: one(shop, { fields: [product.shopId], references: [shop.id] }),
}));

export const categoryRelations = relations(category, ({ many, one }) => ({
  productCategories: many(productCategory),
  shop: one(shop, { fields: [category.shopId], references: [shop.id] }),
}));

export const imageRelations = relations(image, ({ one }) => ({
  product: one(product, {
    fields: [image.productId],
    references: [product.id],
  }),
}));

export const productCategoryRelations = relations(productCategory, ({ one }) => ({
  product: one(product, {
    fields: [productCategory.productId],
    references: [product.id],
  }),
  category: one(category, {
    fields: [productCategory.categoryId],
    references: [category.id],
  }),
}));

export const inventoryLogRelations = relations(inventoryLog, ({ one }) => ({
  product: one(product, {
    fields: [inventoryLog.productId],
    references: [product.id],
  }),
}));
