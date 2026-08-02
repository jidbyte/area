"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/shared/db";
import { review } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/shops/server/authorize";
import { getShopById } from "@/features/shops/server/queries";
import {
  getEligibleSaleItemForReview,
  getReviewByBuyerForProduct,
} from "./queries";
import { reviewSchema, type ReviewInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

function displayNameFor(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.username || "A buyer";
}

export async function upsertReview(
  shopId: string,
  productId: string,
  input: ReviewInput,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to leave a review." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { rating, title, body } = parsed.data;

  const shop = await getShopById(shopId);
  if (!shop) return { success: false, error: "Shop not found." };

  const existing = await getReviewByBuyerForProduct(productId, userId);

  if (!existing) {
    const eligibleSaleItemId = await getEligibleSaleItemForReview(
      shopId,
      productId,
      userId,
    );
    if (!eligibleSaleItemId) {
      return {
        success: false,
        error: "You can only review products you've purchased.",
      };
    }

    const user = await currentUser();
    const buyerName = user ? displayNameFor(user) : "A buyer";

    await db.insert(review).values({
      shopId,
      productId,
      saleItemId: eligibleSaleItemId,
      buyerClerkUserId: userId,
      buyerName,
      rating,
      title: title || null,
      body,
    });
  } else {
    await db
      .update(review)
      .set({ rating, title: title || null, body })
      .where(eq(review.id, existing.id));
  }

  revalidatePath(`/${shop.slug}/product/${productId}`);
  return { success: true, data: undefined };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "You must be signed in." };

  const existing = await db.query.review.findFirst({
    where: eq(review.id, reviewId),
  });
  if (!existing) return { success: false, error: "Review not found." };

  const isAuthor = existing.buyerClerkUserId === userId;
  if (!isAuthor) {
    const authResult = await requireShopMembership(existing.shopId);
    if (!authResult.ok)
      return { success: false, error: "You can't remove this review." };
  }

  await db
    .update(review)
    .set({ deletedAt: new Date() })
    .where(eq(review.id, reviewId));

  const shop = await getShopById(existing.shopId);
  if (shop) revalidatePath(`/${shop.slug}/product/${existing.productId}`);
  revalidatePath("/admin/reviews");

  return { success: true, data: undefined };
}
