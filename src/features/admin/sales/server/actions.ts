"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { sale, saleItem, product, inventoryLog } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import { getShopById } from "@/features/app/stores/server/queries";
import {
  createSaleSchema,
  updateSaleSchema,
  type CreateSaleInput,
  type UpdateSaleInput,
  type PaymentStatus,
} from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

async function generateSaleNumber(shopId: string): Promise<string> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(sale)
    .where(eq(sale.shopId, shopId));
  // Same race-condition caveat as Purchases' PO numbers — see that file.
  return `SALE-${String(value + 1).padStart(4, "0")}`;
}

function computeTotal(
  items: CreateSaleInput["items"],
  discountAmount: number,
): number {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  return Math.max(0, itemsTotal - discountAmount);
}

/**
 * The actual "make a sale happen" logic: writes the sale + items, decrements
 * stock for every line item tied to a real product, and logs each deduction
 * to inventory_log. No auth check here on purpose — Checkout calls this
 * directly (not `createSale`, which gates on shop staff membership, since a
 * buyer isn't staff). `actorClerkUserId` accepts the buyer's real Clerk id
 * when they're signed in, or a sentinel like "storefront-checkout" for
 * guests — inventory_log.actorClerkUserId stays NOT NULL either way.
 */
export async function recordSale(
  shopId: string,
  input: CreateSaleInput,
  actorClerkUserId: string,
  paystackReference?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    console.error(
      "[recordSale] validation failed:",
      parsed.error.issues,
      "input was:",
      input,
    );
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const {
    customerId,
    customerName,
    saleDate,
    paymentStatus,
    balance,
    discountAmount,
    items,
  } = parsed.data;

  // Verify stock before committing to anything — same guard rail as manual
  // stock adjustments in Inventory core (never let quantity go negative).
  for (const item of items) {
    if (!item.productId) continue;
    const productRow = await db.query.product.findFirst({
      where: eq(product.id, item.productId),
    });
    if (productRow && productRow.quantity < item.quantity) {
      return {
        success: false,
        error: `Not enough stock for "${item.productName}" (${productRow.quantity} available).`,
      };
    }
  }

  const saleNumber = await generateSaleNumber(shopId);
  const totalAmount = computeTotal(items, discountAmount);

  const [created] = await db
    .insert(sale)
    .values({
      shopId,
      saleNumber,
      customerId: customerId || null,
      customerName,
      saleDate: new Date(saleDate),
      paystackReference: paystackReference ?? null,
      paymentStatus,
      balance: paymentStatus === "paid" ? 0 : balance,
      discountAmount,
      totalAmount,
    })
    .returning();

  await db.insert(saleItem).values(
    items.map((item) => ({
      saleId: created.id,
      productId: item.productId || null,
      productName: item.productName,
      productCode: item.productCode || null,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    })),
  );

  // Same non-atomicity caveat as Purchases' receiving loop (Neon HTTP
  // driver, no multi-statement transactions) — see that file's comment.
  for (const item of items) {
    if (!item.productId) continue;
    const productRow = await db.query.product.findFirst({
      where: eq(product.id, item.productId),
    });
    if (!productRow) continue;

    await db
      .update(product)
      .set({ quantity: Math.max(0, productRow.quantity - item.quantity) })
      .where(eq(product.id, item.productId));

    await db.insert(inventoryLog).values({
      productId: item.productId,
      delta: -item.quantity,
      reason: `Sold via ${saleNumber}`,
      actorClerkUserId,
    });
  }

  const parentShop = await getShopById(shopId);
  revalidatePath(`/${parentShop?.slug}/transactions/sales`);
  revalidatePath(`/${parentShop?.slug}/products`);
  return { success: true, data: { id: created.id } };
}

export async function createSale(
  shopId: string,
  input: CreateSaleInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  return recordSale(shopId, input, authResult.userId);
}

export async function updateSale(
  saleId: string,
  input: UpdateSaleInput,
): Promise<ActionResult> {
  const existing = await db.query.sale.findFirst({
    where: eq(sale.id, saleId),
    with: { items: true },
  });
  if (!existing) return { success: false, error: "Sale not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (existing.paymentStatus === "cancelled") {
    return {
      success: false,
      error: "This sale is cancelled and can't be edited.",
    };
  }

  const parsed = updateSaleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { customerId, customerName, saleDate, discountAmount } = parsed.data;

  // Items are locked after creation (see recordSale's doc comment) — only
  // the discount can change the total, recomputed from the existing items.
  const itemsTotal = existing.items.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const totalAmount = Math.max(0, itemsTotal - discountAmount);

  await db
    .update(sale)
    .set({
      customerId: customerId || null,
      customerName,
      saleDate: new Date(saleDate),
      discountAmount,
      totalAmount,
    })
    .where(eq(sale.id, saleId));

  revalidatePath(`/${authResult.shop.slug}/transactions/sales`);
  revalidatePath(`/${authResult.shop.slug}/transactions/sales/${saleId}`);
  return { success: true, data: undefined };
}

export async function updateSalePaymentInfo(
  saleId: string,
  paymentStatus: Exclude<PaymentStatus, "cancelled">,
  balance: number,
): Promise<ActionResult> {
  const existing = await db.query.sale.findFirst({
    where: eq(sale.id, saleId),
  });
  if (!existing) return { success: false, error: "Sale not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (existing.paymentStatus === "cancelled") {
    return { success: false, error: "This sale is cancelled." };
  }

  await db
    .update(sale)
    .set({ paymentStatus, balance: paymentStatus === "paid" ? 0 : balance })
    .where(eq(sale.id, saleId));

  revalidatePath(`/${authResult.shop.slug}/transactions/sales/${saleId}`);
  return { success: true, data: undefined };
}

export async function cancelSale(saleId: string): Promise<ActionResult> {
  const existing = await db.query.sale.findFirst({
    where: eq(sale.id, saleId),
    with: { items: true },
  });
  if (!existing) return { success: false, error: "Sale not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (existing.paymentStatus === "cancelled") {
    return { success: false, error: "This sale is already cancelled." };
  }

  // Reverse the deduction — give the stock back, log it the same way it was
  // taken out.
  for (const item of existing.items) {
    if (!item.productId) continue;
    const productRow = await db.query.product.findFirst({
      where: eq(product.id, item.productId),
    });
    if (!productRow) continue;

    await db
      .update(product)
      .set({ quantity: productRow.quantity + item.quantity })
      .where(eq(product.id, item.productId));

    await db.insert(inventoryLog).values({
      productId: item.productId,
      delta: item.quantity,
      reason: `Sale ${existing.saleNumber} cancelled — stock restored`,
      actorClerkUserId: authResult.userId,
    });
  }

  await db
    .update(sale)
    .set({ paymentStatus: "cancelled", balance: 0 })
    .where(eq(sale.id, saleId));

  revalidatePath(`/${authResult.shop.slug}/transactions/sales`);
  revalidatePath(`/${authResult.shop.slug}/transactions/sales/${saleId}`);
  revalidatePath(`/${authResult.shop.slug}/products`);
  return { success: true, data: undefined };
}
