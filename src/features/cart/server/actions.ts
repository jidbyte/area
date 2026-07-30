"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { cart, cartItem, product, customer } from "@/shared/db/schema";
import { resolveOrCreateBuyerIdentity } from "./identity";
import { getCartRecord } from "./queries";
import { recordSale } from "@/features/sales/server/actions";
import { getCartWithItems } from "@/features/cart/server/queries";
import { checkoutSchema, type CheckoutInput } from "../../cart/server/schema";
import type { CreateSaleInput } from "@/features/sales/server/schema";

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

  revalidatePath(`/${slug}`);
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

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/cart`);
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
    revalidatePath(`/${slug}/cart`);
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
  revalidatePath(`/${slug}/cart`);
  return { success: true, data: undefined };
}

export async function removeCartItem(
  cartItemId: string,
  slug: string,
): Promise<ActionResult> {
  const check = await verifyCartItemOwnership(cartItemId);
  if (!check.ok) return { success: false, error: check.error };

  await db.delete(cartItem).where(eq(cartItem.id, cartItemId));
  revalidatePath(`/${slug}/cart`);
  return { success: true, data: undefined };
}

export async function placeOrder(
  shopId: string,
  input: CheckoutInput,
): Promise<ActionResult<{ saleId: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const identity = await resolveOrCreateBuyerIdentity();
  const cartRecord = await getCartWithItems(shopId, identity);
  if (!cartRecord || cartRecord.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  const customerId = await findOrCreateCustomer(
    shopId,
    parsed.data,
    identity.buyerClerkUserId,
  );

  const items: CreateSaleInput["items"] = cartRecord.items.map((item) => ({
    productId: item.productId,
    productName: item.product.name,
    productCode: item.product.code ?? "",
    productSku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.product.price,
  }));
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  // Paystack isn't wired up yet — every storefront order lands as "pending"
  // with the full amount owed. Once payments arrive, this becomes "paid" (or
  // fails before a sale is even recorded) based on the actual charge.
  const result = await recordSale(
    shopId,
    {
      customerId,
      customerName: parsed.data.name,
      saleDate: new Date().toISOString().slice(0, 10),
      paymentStatus: "pending",
      balance: total,
      discountAmount: 0,
      items,
    },
    identity.buyerClerkUserId ?? "storefront-checkout",
  );

  if (!result.success) return result;

  // Turn the cart into a sale, then empty it — the cart row itself stays
  // around so the same buyer/guest can start fresh without a new row.
  // No revalidatePath needed here for the buyer-facing pages (cart/checkout
  // are already `force-dynamic`); recordSale already revalidates the admin
  // sales/products paths internally.
  await db.delete(cartItem).where(eq(cartItem.cartId, cartRecord.id));

  return { success: true, data: { saleId: result.data.id } };
}

async function findOrCreateCustomer(
  shopId: string,
  input: CheckoutInput,
  buyerClerkUserId: string | null,
): Promise<string> {
  const existing = await db.query.customer.findFirst({
    where: and(eq(customer.shopId, shopId), eq(customer.email, input.email)),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(customer)
    .values({
      shopId,
      buyerClerkUserId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      customerType: "individual",
    })
    .returning();
  return created.id;
}
