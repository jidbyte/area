import { and, desc, eq, gte, ilike, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/shared/db";
import { product, sale, saleItem, shop, category, productCategory } from "@/shared/db/schema";

export type CatalogProduct = {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  primaryImageUrl: string | null;
  shopId: string;
  shopSlug: string;
  shopName: string;
  currency: string;
};

function toCatalogProduct(
  p: {
    id: string;
    name: string;
    sellingPrice: number;
    quantity: number;
    images: { url: string; isPrimary: boolean }[];
    shopId: string;
  },
  shopBySlugMap: Map<string, { slug: string; name: string; currency: string }>,
): CatalogProduct {
  const s = shopBySlugMap.get(p.shopId)!;
  return {
    id: p.id,
    name: p.name,
    sellingPrice: p.sellingPrice,
    quantity: p.quantity,
    primaryImageUrl: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
    shopId: p.shopId,
    shopSlug: s.slug,
    shopName: s.name,
    currency: s.currency,
  };
}

async function shopMapFor(shopIds: string[]) {
  if (shopIds.length === 0) return new Map();
  const shops = await db.query.shop.findMany({
    where: inArray(shop.id, Array.from(new Set(shopIds))),
    columns: { id: true, slug: true, name: true, currency: true },
  });
  return new Map(shops.map((s) => [s.id, s]));
}

export async function countActiveProducts(): Promise<number> {
  const rows = await db.query.product.findMany({
    where: and(eq(product.isActive, true), isNull(product.deletedAt)),
    columns: { id: true },
  });
  return rows.length;
}

/**
 * Platform-wide sales ranking, same aggregation logic as the per-shop
 * version (inventory/server/queries.ts getBestSellingProducts) but without
 * the shopId filter. `offset` lets the landing page take a "featured" slice
 * as "the next best-selling products after best-selling" per spec, rather
 * than a separate ranking signal.
 */
export async function getPlatformRankedBySales(
  limit: number,
  offset = 0,
): Promise<CatalogProduct[]> {
  const rows = await db
    .select({
      productId: saleItem.productId,
      quantity: saleItem.quantity,
      paymentStatus: sale.paymentStatus,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id));

  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.paymentStatus === "cancelled" || !row.productId) continue;
    totals.set(row.productId, (totals.get(row.productId) ?? 0) + row.quantity);
  }

  const rankedIds = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(offset, offset + limit)
    .map(([productId]) => productId);

  if (rankedIds.length === 0) return [];

  const products = await db.query.product.findMany({
    where: and(
      inArray(product.id, rankedIds),
      eq(product.isActive, true),
      isNull(product.deletedAt),
    ),
    with: { images: true },
  });

  const shopBySlugMap = await shopMapFor(products.map((p) => p.shopId));
  const byId = new Map(products.map((p) => [p.id, p]));
  return rankedIds
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined)
    .map((p) => toCatalogProduct(p, shopBySlugMap));
}

export async function getPlatformLatestProducts(
  limit: number,
  excludeIds: string[] = [],
): Promise<CatalogProduct[]> {
  const products = await db.query.product.findMany({
    where: and(eq(product.isActive, true), isNull(product.deletedAt)),
    orderBy: [desc(product.createdAt)],
    limit: limit + excludeIds.length,
    with: { images: true },
  });

  const filtered = products
    .filter((p) => !excludeIds.includes(p.id))
    .slice(0, limit);

  const shopBySlugMap = await shopMapFor(filtered.map((p) => p.shopId));
  return filtered.map((p) => toCatalogProduct(p, shopBySlugMap));
}

export async function searchPlatformProducts(options: {
  query?: string;
  categoryName?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  limit?: number;
}): Promise<CatalogProduct[]> {
  const { query, categoryName, sort = "newest", limit = 60 } = options;

  let productIds: string[] | null = null;
  if (categoryName) {
    const rows = await db
      .select({ productId: productCategory.productId })
      .from(productCategory)
      .innerJoin(category, eq(productCategory.categoryId, category.id))
      .where(eq(category.name, categoryName.toLowerCase()));
    productIds = rows.map((r) => r.productId);
    if (productIds.length === 0) return [];
  }

  const conditions = [eq(product.isActive, true), isNull(product.deletedAt)];
  if (query) {
    conditions.push(
      or(ilike(product.name, `%${query}%`), ilike(product.sku, `%${query}%`))!,
    );
  }
  if (productIds) conditions.push(inArray(product.id, productIds));

  const orderBy =
    sort === "price-asc"
      ? [product.sellingPrice]
      : sort === "price-desc"
        ? [desc(product.sellingPrice)]
        : [desc(product.createdAt)];

  const products = await db.query.product.findMany({
    where: and(...conditions),
    orderBy,
    limit,
    with: { images: true },
  });

  const shopBySlugMap = await shopMapFor(products.map((p) => p.shopId));
  return products.map((p) => toCatalogProduct(p, shopBySlugMap));
}

export async function listAllCategoryNames(): Promise<string[]> {
  const rows = await db.query.category.findMany({ columns: { name: true } });
  return Array.from(new Set(rows.map((r) => r.name))).sort();
}
