import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/shared/db";
import { product, category, sale, saleItem } from "@/shared/db/schema";

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
    where: and(
      eq(product.shopId, shopId),
      eq(product.isActive, true),
      isNull(product.deletedAt),
    ),
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
export async function listActiveProductsByShopAndCategory(
  shopId: string,
  categoryName: string,
) {
  const products = await listActiveProductsByShop(shopId);
  const needle = categoryName.toLowerCase();
  return products.filter((p) =>
    p.productCategories.some((pc) => pc.category.name.toLowerCase() === needle),
  );
}

// Simple name-substring search for the storefront search box. Same "filter
// in JS for now" scoping note as above — proper Postgres FTS is its own
// later phase.
export async function searchActiveProductsByShop(
  shopId: string,
  query: string,
) {
  const products = await listActiveProductsByShop(shopId);
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => p.name.toLowerCase().includes(q));
}

export async function getBestSellingProducts(shopId: string, limit = 10) {
  const rows = await db
    .select({
      productId: saleItem.productId,
      quantity: saleItem.quantity,
      paymentStatus: sale.paymentStatus,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .where(eq(sale.shopId, shopId));

  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.paymentStatus === "cancelled" || !row.productId) continue;
    totals.set(row.productId, (totals.get(row.productId) ?? 0) + row.quantity);
  }

  const totalSoldCount = totals.size;
  const rankedIds = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId]) => productId);

  if (rankedIds.length === 0) return { products: [], totalSoldCount: 0 };

  const products = await db.query.product.findMany({
    where: and(
      inArray(product.id, rankedIds),
      eq(product.isActive, true),
      isNull(product.deletedAt),
    ),
    with: { images: true },
  });

  // The product query above doesn't preserve the sales-ranked order, so
  // re-sort to match rankedIds.
  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered = rankedIds
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined);

  return { products: ordered, totalSoldCount };
}
