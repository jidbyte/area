"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { cart, cartItem, product } from "@/shared/db/schema";
import { resolveOrCreateBuyerIdentity } from "./identity";
import { getCartRecord } from "./cart-queries";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

async function getOrCreateCart(shopId: string, slug: string) {
  const identity = await resolveOrCreateBuyerIdentity();
  const existing = await getCartRecord(shopId, identity);
  if (existing) return existing;

  const [created] = await db
    .insert(cart)
    .values({
      shopId,
      buyerClerkUserId: identity.buyerClerkUserId,
      guestId: identity.guestId,
    })
    .returning();

  revalidatePath(`/stores/${slug}`);
  return created;
}

export async function addToCart(
  shopId: string,
  slug: string,
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  if (quantity < 1)
    return { success: false, error: "Quantity must be at least 1." };

  const productRow = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });
  if (!productRow || productRow.shopId !== shopId) {
    return { success: false, error: "Product not found." };
  }

  const cartRecord = await getOrCreateCart(shopId, slug);

  const existingItem = await db.query.cartItem.findFirst({
    where: and(
      eq(cartItem.cartId, cartRecord.id),
      eq(cartItem.productId, productId),
    ),
  });

  const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
  if (nextQuantity > productRow.quantity) {
    return {
      success: false,
      error: `Only ${productRow.quantity} of "${productRow.name}" available.`,
    };
  }

  if (existingItem) {
    await db
      .update(cartItem)
      .set({ quantity: nextQuantity })
      .where(eq(cartItem.id, existingItem.id));
  } else {
    await db
      .insert(cartItem)
      .values({ cartId: cartRecord.id, productId, quantity: nextQuantity });
  }

  revalidatePath(`/stores/${slug}`);
  revalidatePath(`/stores/${slug}/cart`);
  return { success: true, data: undefined };
}

async function verifyCartItemOwnership(cartItemId: string) {
  const item = await db.query.cartItem.findFirst({
    where: eq(cartItem.id, cartItemId),
    with: { cart: true },
  });
  if (!item) return { ok: false as const, error: "Item not found." };

  const identity = await resolveOrCreateBuyerIdentity();
  const owns =
    (identity.buyerClerkUserId &&
      item.cart.buyerClerkUserId === identity.buyerClerkUserId) ||
    (identity.guestId && item.cart.guestId === identity.guestId);

  if (!owns)
    return { ok: false as const, error: "You don't have access to this cart." };
  return { ok: true as const, item };
}

export async function updateCartItemQuantity(
  cartItemId: string,
  slug: string,
  quantity: number,
): Promise<ActionResult> {
  const check = await verifyCartItemOwnership(cartItemId);
  if (!check.ok) return { success: false, error: check.error };

  if (quantity < 1) {
    await db.delete(cartItem).where(eq(cartItem.id, cartItemId));
    revalidatePath(`/stores/${slug}/cart`);
    return { success: true, data: undefined };
  }

  const productRow = await db.query.product.findFirst({
    where: eq(product.id, check.item.productId),
  });
  if (productRow && quantity > productRow.quantity) {
    return {
      success: false,
      error: `Only ${productRow.quantity} of "${productRow.name}" available.`,
    };
  }

  await db
    .update(cartItem)
    .set({ quantity })
    .where(eq(cartItem.id, cartItemId));
  revalidatePath(`/stores/${slug}/cart`);
  return { success: true, data: undefined };
}

export async function removeCartItem(
  cartItemId: string,
  slug: string,
): Promise<ActionResult> {
  const check = await verifyCartItemOwnership(cartItemId);
  if (!check.ok) return { success: false, error: check.error };

  await db.delete(cartItem).where(eq(cartItem.id, cartItemId));
  revalidatePath(`/stores/${slug}/cart`);
  return { success: true, data: undefined };
}

/**
 * Merges a guest's zustand cart (built up client-side, no server writes
 * until now) into a real DB cart the moment they head to checkout — payment
 * and stock validation need server-side authority regardless of how the
 * cart was assembled, so checkout always reads from the DB cart from this
 * point on, same as it always has. Reuses addToCart's own stock-clamping
 * logic per item rather than duplicating it.
 */
export async function syncGuestCartToServer(
  shopId: string,
  slug: string,
  items: { productId: string; quantity: number }[],
): Promise<ActionResult> {
  for (const item of items) {
    const result = await addToCart(shopId, slug, item.productId, item.quantity);
    if (!result.success) {
      // One item failing (e.g. now out of stock) shouldn't block the rest
      // of the cart from syncing — the checkout page will show whatever
      // actually made it into the DB cart.
      console.error("[syncGuestCartToServer] item failed to sync:", item.productId, result.error);
    }
  }
  return { success: true, data: undefined };
}
