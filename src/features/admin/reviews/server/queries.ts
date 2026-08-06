import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";

import { db } from "@/shared/db";
import { review, saleItem, sale, customer, product } from "@/shared/db/schema";

export async function getReviewsForProduct(productId: string) {
  return db.query.review.findMany({
    where: and(eq(review.productId, productId), isNull(review.deletedAt)),
    orderBy: [desc(review.createdAt)],
  });
}

export async function getReviewSummaryForProduct(productId: string) {
  const reviews = await db.query.review.findMany({
    where: and(eq(review.productId, productId), isNull(review.deletedAt)),
    columns: { rating: true },
  });

  if (reviews.length === 0) return { averageRating: 0, reviewCount: 0 };

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { averageRating, reviewCount: reviews.length };
}

export async function getReviewSummariesForProducts(
  productIds: string[],
): Promise<Map<string, { averageRating: number; reviewCount: number }>> {
  if (productIds.length === 0) return new Map();

  const rows = await db.query.review.findMany({
    where: and(inArray(review.productId, productIds), isNull(review.deletedAt)),
    columns: { productId: true, rating: true },
  });

  const ratingsByProduct = new Map<string, number[]>();
  for (const r of rows) {
    const list = ratingsByProduct.get(r.productId) ?? [];
    list.push(r.rating);
    ratingsByProduct.set(r.productId, list);
  }

  const summaries = new Map<string, { averageRating: number; reviewCount: number }>();
  for (const [productId, ratings] of ratingsByProduct) {
    summaries.set(productId, {
      averageRating: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
      reviewCount: ratings.length,
    });
  }
  return summaries;
}

export async function getReviewByBuyerForProduct(
  productId: string,
  buyerClerkUserId: string,
) {
  return db.query.review.findFirst({
    where: and(
      eq(review.productId, productId),
      eq(review.buyerClerkUserId, buyerClerkUserId),
    ),
  });
}

/**
 * Bulk version for the order-history page — one query instead of one per
 * line item, keyed by productId for easy lookup while rendering.
 */
export async function getReviewsByBuyerForProducts(
  buyerClerkUserId: string,
  productIds: string[],
) {
  if (productIds.length === 0) return new Map<string, typeof review.$inferSelect>();
  const rows = await db.query.review.findMany({
    where: and(
      eq(review.buyerClerkUserId, buyerClerkUserId),
      inArray(review.productId, productIds),
    ),
  });
  return new Map(rows.map((r) => [r.productId, r]));
}

/**
 * Verified-purchase check: does this signed-in buyer have a non-cancelled
 * sale, at this shop, containing this product? Returns the most recent
 * qualifying sale_item id (stored on the review for traceability) or null
 * if they haven't bought it. Pending (pay-on-delivery, not yet paid) sales
 * still count — the product was ordered, which is what eligibility is
 * actually about, not whether payment has been collected yet.
 */
export async function getEligibleSaleItemForReview(
  shopId: string,
  productId: string,
  buyerClerkUserId: string,
): Promise<string | null> {
  const rows = await db
    .select({ saleItemId: saleItem.id, saleDate: sale.saleDate })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .innerJoin(customer, eq(sale.customerId, customer.id))
    .where(
      and(
        eq(customer.buyerClerkUserId, buyerClerkUserId),
        eq(customer.shopId, shopId),
        eq(saleItem.productId, productId),
        ne(sale.paymentStatus, "cancelled"),
      ),
    )
    .orderBy(desc(sale.saleDate))
    .limit(1);

  return rows[0]?.saleItemId ?? null;
}

/** Admin moderation view — every review across the shop's products. */
export async function listReviewsForShop(shopId: string) {
  return db
    .select({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      buyerName: review.buyerName,
      createdAt: review.createdAt,
      productId: review.productId,
      productName: product.name,
    })
    .from(review)
    .innerJoin(product, eq(review.productId, product.id))
    .where(and(eq(review.shopId, shopId), isNull(review.deletedAt)))
    .orderBy(desc(review.createdAt));
}
