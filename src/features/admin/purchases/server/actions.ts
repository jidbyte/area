"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import {
  purchase,
  purchaseItem,
  product,
  inventoryLog,
} from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import {
  createPurchaseSchema,
  type CreatePurchaseInput,
  type PurchaseStatus,
  type PaymentStatus,
} from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

async function generatePurchaseNumber(shopId: string): Promise<string> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(purchase)
    .where(eq(purchase.shopId, shopId));
  // Not race-safe under heavy concurrency (two simultaneous creates could
  // land on the same number) — acceptable for a single-owner admin panel.
  // The unique constraint on (shopId, purchaseNumber) means a collision
  // fails loudly instead of silently duplicating; a retry resolves it.
  return `PO-${String(value + 1).padStart(4, "0")}`;
}

function computeTotal(
  items: CreatePurchaseInput["items"],
  shippingCost: number,
  discountAmount: number,
): number {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );
  return Math.max(0, itemsTotal + shippingCost - discountAmount);
}

export async function createPurchase(
  shopId: string,
  input: CreatePurchaseInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = createPurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const {
    supplierId,
    supplierName,
    purchaseDate,
    eta,
    shippingCost,
    discountAmount,
    items,
  } = parsed.data;

  const purchaseNumber = await generatePurchaseNumber(shopId);
  const totalAmount = computeTotal(items, shippingCost, discountAmount);

  const [created] = await db
    .insert(purchase)
    .values({
      shopId,
      purchaseNumber,
      supplierId: supplierId || null,
      supplierName,
      purchaseDate: new Date(purchaseDate),
      eta: eta ? new Date(eta) : null,
      shippingCost,
      discountAmount,
      totalAmount,
      paymentStatus: "pending",
      purchaseStatus: "draft",
    })
    .returning();

  await db.insert(purchaseItem).values(
    items.map((item) => ({
      purchaseId: created.id,
      productId: item.productId || null,
      productName: item.productName,
      productCode: item.productCode || null,
      productSku: item.productSku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
    })),
  );

  revalidatePath(`/${authResult.shop.slug}/transactions/purchases`);
  return { success: true, data: { id: created.id } };
}

export async function updatePurchase(
  purchaseId: string,
  input: CreatePurchaseInput,
): Promise<ActionResult> {
  const existing = await db.query.purchase.findFirst({
    where: eq(purchase.id, purchaseId),
  });
  if (!existing) return { success: false, error: "Purchase order not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (existing.purchaseStatus !== "draft") {
    return {
      success: false,
      error: "Only draft purchase orders can be edited.",
    };
  }

  const parsed = createPurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const {
    supplierId,
    supplierName,
    purchaseDate,
    eta,
    shippingCost,
    discountAmount,
    items,
  } = parsed.data;

  const totalAmount = computeTotal(items, shippingCost, discountAmount);

  await db
    .update(purchase)
    .set({
      supplierId: supplierId || null,
      supplierName,
      purchaseDate: new Date(purchaseDate),
      eta: eta ? new Date(eta) : null,
      shippingCost,
      discountAmount,
      totalAmount,
    })
    .where(eq(purchase.id, purchaseId));

  // Replace items wholesale — same pattern as product images/categories.
  await db.delete(purchaseItem).where(eq(purchaseItem.purchaseId, purchaseId));
  await db.insert(purchaseItem).values(
    items.map((item) => ({
      purchaseId,
      productId: item.productId || null,
      productName: item.productName,
      productCode: item.productCode || null,
      productSku: item.productSku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
    })),
  );

  revalidatePath(`/${authResult.shop.slug}/transactions/purchases`);
  revalidatePath(`/${authResult.shop.slug}/transactions/purchases/${purchaseId}`);
  return { success: true, data: undefined };
}

export async function updatePurchaseStatus(
  purchaseId: string,
  nextStatus: PurchaseStatus,
): Promise<ActionResult> {
  const existing = await db.query.purchase.findFirst({
    where: eq(purchase.id, purchaseId),
    with: { items: true },
  });
  if (!existing) return { success: false, error: "Purchase order not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (
    existing.purchaseStatus === "received" ||
    existing.purchaseStatus === "cancelled"
  ) {
    return {
      success: false,
      error: `This order is already ${existing.purchaseStatus} and can't be changed.`,
    };
  }

  if (nextStatus === "received") {
    // The whole point of receiving: credit stock for every line item tied to
    // a real product, and log it the same way manual stock edits are logged
    // (the inventory_log table from Inventory core).
    //
    // NOTE: our DB driver (Neon HTTP) doesn't support multi-statement
    // transactions, so this loop isn't atomic — if it fails partway through
    // a multi-item order, some products get credited and others don't. For a
    // single-owner admin panel with modest order sizes this is an acceptable
    // trade-off for now; switching to Neon's websocket driver (which does
    // support db.transaction()) would close this gap if it ever matters.
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
        reason: `Received purchase order ${existing.purchaseNumber}`,
        actorClerkUserId: authResult.userId,
      });
    }
    await db
      .update(purchase)
      .set({ purchaseStatus: "received", deliveryDate: new Date() })
      .where(eq(purchase.id, purchaseId));
  } else {
    await db
      .update(purchase)
      .set({ purchaseStatus: nextStatus })
      .where(eq(purchase.id, purchaseId));
  }

  revalidatePath(`/${authResult.shop.slug}/transactions/purchases`);
  revalidatePath(`/${authResult.shop.slug}/transactions/purchases/${purchaseId}`);
  revalidatePath(`/${authResult.shop.slug}/products`);
  return { success: true, data: undefined };
}

export async function updatePurchasePaymentStatus(
  purchaseId: string,
  nextStatus: PaymentStatus,
): Promise<ActionResult> {
  const existing = await db.query.purchase.findFirst({
    where: eq(purchase.id, purchaseId),
  });
  if (!existing) return { success: false, error: "Purchase order not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db
    .update(purchase)
    .set({ paymentStatus: nextStatus })
    .where(eq(purchase.id, purchaseId));

  revalidatePath(`/${authResult.shop.slug}/transactions/purchases/${purchaseId}`);
  return { success: true, data: undefined };
}
