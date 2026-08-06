"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { coupon } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import { couponSchema, type CouponInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export async function listCouponsByShop(shopId: string) {
  return db.query.coupon.findMany({
    where: and(eq(coupon.shopId, shopId), isNull(coupon.deletedAt)),
    orderBy: [desc(coupon.createdAt)],
  });
}

export async function createCoupon(
  shopId: string,
  input: CouponInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const code = normalizeCode(parsed.data.code);

  const existing = await db.query.coupon.findFirst({
    where: and(eq(coupon.shopId, shopId), eq(coupon.code, code), isNull(coupon.deletedAt)),
  });
  if (existing) return { success: false, error: "A coupon with that code already exists." };

  const [created] = await db
    .insert(coupon)
    .values({
      shopId,
      code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      minOrderAmount: parsed.data.minOrderAmount,
      maxRedemptions: parsed.data.maxRedemptions ?? null,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      isActive: parsed.data.isActive,
    })
    .returning();

  revalidatePath(`/${authResult.shop.slug}/transactions/coupons`);
  return { success: true, data: { id: created.id } };
}

export async function updateCoupon(
  couponId: string,
  input: CouponInput,
): Promise<ActionResult> {
  const existing = await db.query.coupon.findFirst({ where: eq(coupon.id, couponId) });
  if (!existing) return { success: false, error: "Coupon not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const code = normalizeCode(parsed.data.code);

  const codeTaken = await db.query.coupon.findFirst({
    where: and(eq(coupon.shopId, existing.shopId), eq(coupon.code, code), isNull(coupon.deletedAt)),
  });
  if (codeTaken && codeTaken.id !== couponId) {
    return { success: false, error: "A coupon with that code already exists." };
  }

  await db
    .update(coupon)
    .set({
      code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      minOrderAmount: parsed.data.minOrderAmount,
      maxRedemptions: parsed.data.maxRedemptions ?? null,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      isActive: parsed.data.isActive,
    })
    .where(eq(coupon.id, couponId));

  revalidatePath(`/${authResult.shop.slug}/transactions/coupons`);
  return { success: true, data: undefined };
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  const existing = await db.query.coupon.findFirst({ where: eq(coupon.id, couponId) });
  if (!existing) return { success: false, error: "Coupon not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db.update(coupon).set({ deletedAt: new Date() }).where(eq(coupon.id, couponId));

  revalidatePath(`/${authResult.shop.slug}/transactions/coupons`);
  return { success: true, data: undefined };
}

export type CouponValidationResult =
  | { valid: true; couponId: string; code: string; discountAmount: number }
  | { valid: false; error: string };

/**
 * Called from the cart/checkout flow — not permission-gated, since any
 * buyer needs to be able to apply a code. All the real constraints
 * (active, in date range, redemption cap, minimum order) are enforced
 * here server-side; the cart/checkout UI only ever displays the result.
 */
export async function validateCoupon(
  shopId: string,
  code: string,
  orderAmount: number,
): Promise<CouponValidationResult> {
  const normalized = normalizeCode(code);
  const record = await db.query.coupon.findFirst({
    where: and(eq(coupon.shopId, shopId), eq(coupon.code, normalized), isNull(coupon.deletedAt)),
  });

  if (!record) return { valid: false, error: "That coupon code isn't valid." };
  if (!record.isActive) return { valid: false, error: "That coupon isn't active." };

  const now = new Date();
  if (record.startsAt && record.startsAt > now) {
    return { valid: false, error: "That coupon isn't active yet." };
  }
  if (record.expiresAt && record.expiresAt < now) {
    return { valid: false, error: "That coupon has expired." };
  }
  if (record.maxRedemptions !== null && record.redemptionCount >= record.maxRedemptions) {
    return { valid: false, error: "That coupon has reached its redemption limit." };
  }
  if (orderAmount < record.minOrderAmount) {
    return {
      valid: false,
      error: `This coupon requires a minimum order amount.`,
    };
  }

  const discountAmount =
    record.discountType === "percentage"
      ? Math.round((orderAmount * record.discountValue) / 100)
      : Math.min(record.discountValue, orderAmount);

  return { valid: true, couponId: record.id, code: record.code, discountAmount };
}

/** Called once checkout actually completes, to atomically bump the counter. */
export async function incrementCouponRedemption(couponId: string): Promise<void> {
  const record = await db.query.coupon.findFirst({ where: eq(coupon.id, couponId) });
  if (!record) return;
  await db
    .update(coupon)
    .set({ redemptionCount: record.redemptionCount + 1 })
    .where(eq(coupon.id, couponId));
}
