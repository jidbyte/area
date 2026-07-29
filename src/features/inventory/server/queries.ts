import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/shared/db";
import { product, category } from "@/shared/db/schema";

export async function listProductsByShop(shopId: string) {
  return db.query.product.findMany({
    where: and(eq(product.shopId, shopId), isNull(product.deletedAt)),
    orderBy: [desc(product.createdAt)],
    with: {
      images: true,
      productCategories: { with: { category: true } },
    },
  });
}

export async function getProductById(productId: string) {
  return db.query.product.findFirst({
    where: eq(product.id, productId),
    with: {
      images: true,
      productCategories: { with: { category: true } },
    },
  });
}

export async function listCategoriesByShop(shopId: string) {
  return db.query.category.findMany({ where: eq(category.shopId, shopId) });
}

// --- Buyer-facing (storefront) queries — active, non-deleted products only ---

export async function listActiveProductsByShop(shopId: string) {
  return db.query.product.findMany({
    where: and(eq(product.shopId, shopId), eq(product.isActive, true), isNull(product.deletedAt)),
    orderBy: [desc(product.createdAt)],
    with: {
      images: true,
      productCategories: { with: { category: true } },
    },
  });
}

export async function getActiveProductById(shopId: string, productId: string) {
  return db.query.product.findFirst({
    where: and(
      eq(product.id, productId),
      eq(product.shopId, shopId),
      eq(product.isActive, true),
      isNull(product.deletedAt),
    ),
    with: {
      images: true,
      productCategories: { with: { category: true } },
    },
  });
}

// Filters in JS after fetching the shop's active catalog — simplest correct
// approach while catalogs are small. Move to a proper SQL join if a shop's
// product count grows large enough for this to matter.
export async function listActiveProductsByShopAndCategory(shopId: string, categoryName: string) {
  const products = await listActiveProductsByShop(shopId);
  const needle = categoryName.toLowerCase();
  return products.filter((p) =>
    p.productCategories.some((pc) => pc.category.name.toLowerCase() === needle),
  );
}

// Simple name-substring search for the storefront search box. Same "filter
// in JS for now" scoping note as above — proper Postgres FTS is its own
// later phase.
export async function searchActiveProductsByShop(shopId: string, query: string) {
  const products = await listActiveProductsByShop(shopId);
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => p.name.toLowerCase().includes(q));
}
