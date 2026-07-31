"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customer, cartItem } from "@/shared/db/schema";
import { recordSale } from "@/features/sales/server/actions";
import type { CreateSaleInput } from "@/features/sales/server/schema";
import { getSaleByPaystackReference } from "@/features/sales/server/queries";
import {
  resolveOrCreateBuyerIdentity,
  type BuyerIdentity,
} from "@/features/cart/server/identity";
import { getCartWithItems } from "@/features/cart/server/queries";
import { getShopById } from "@/features/shops/server/queries";
import { sendOrderNotifications } from "@/features/notifications/server/send-order-notifications";
import {
  initializeTransaction,
  verifyTransaction,
  parsePaystackMetadata,
} from "@/shared/lib/paystack";
import { CheckoutInput, checkoutSchema } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

async function findOrCreateCustomer(
  shopId: string,
  input: { name: string; email: string; phone: string; address: string },
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

async function buildItemsFromCart(shopId: string, identity: BuyerIdentity) {
  const cartRecord = await getCartWithItems(shopId, identity);
  if (!cartRecord || cartRecord.items.length === 0) return null;

  // No type annotation here on purpose — item.productId etc. are always
  // plain, non-optional strings from the DB, so letting TS infer the
  // literal shape keeps productId required. Annotating this as
  // CreateSaleInput["items"] (whose Zod schema allows productId to be
  // optional/"") would widen it just enough to stop satisfying
  // PaystackCheckoutMetadata["items"], which requires it always present.
  const items = cartRecord.items.map((item) => ({
    productId: item.productId,
    productName: item.product.name,
    productCode: item.product.code ?? "",
    productSku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.product.price,
  }));

  return { cartRecord, items };
}

async function finalizeSale(
  shopId: string,
  cartId: string,
  input: CreateSaleInput,
  actorClerkUserId: string,
  paystackReference?: string,
): Promise<ActionResult<{ saleId: string }>> {
  const result = await recordSale(
    shopId,
    input,
    actorClerkUserId,
    paystackReference,
  );
  if (!result.success) return result;

  await db.delete(cartItem).where(eq(cartItem.cartId, cartId));

  // Awaited (not fire-and-forget) — on serverless, un-awaited work can be
  // torn down the moment the response is sent. The function itself never
  // throws, so this adds a little latency but can't turn a successful order
  // into a failure response.
  await sendOrderNotifications(result.data.id);

  return { success: true, data: { saleId: result.data.id } };
}

export async function initiateCheckout(
  shopId: string,
  input: CheckoutInput,
): Promise<ActionResult<{ authorizationUrl: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const shop = await getShopById(shopId);
  if (!shop) return { success: false, error: "Shop not found." };
  if (!shop.paystackSubaccountCode) {
    return {
      success: false,
      error:
        "This shop hasn't finished setting up online payments yet — try Pay on delivery instead.",
    };
  }

  const identity = await resolveOrCreateBuyerIdentity();
  const built = await buildItemsFromCart(shopId, identity);
  if (!built) return { success: false, error: "Your cart is empty." };
  const { cartRecord, items } = built;

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const result = await initializeTransaction({
    email: parsed.data.email,
    amountInWholeCurrency: total,
    currency: shop.currency,
    subaccountCode: shop.paystackSubaccountCode,
    callbackUrl: `${appUrl}/${shop.slug}/order/processing`,
    metadata: {
      shopId,
      cartId: cartRecord.id,
      buyerClerkUserId: identity.buyerClerkUserId,
      customerInput: parsed.data,
      items,
    },
  });

  if (!result.ok) return { success: false, error: result.error };
  return {
    success: true,
    data: { authorizationUrl: result.data.authorization_url },
  };
}

export async function placeOrderPayOnDelivery(
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
  const built = await buildItemsFromCart(shopId, identity);
  if (!built) return { success: false, error: "Your cart is empty." };
  const { cartRecord, items } = built;

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const customerId = await findOrCreateCustomer(
    shopId,
    parsed.data,
    identity.buyerClerkUserId,
  );

  return finalizeSale(
    shopId,
    cartRecord.id,
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
}

export async function completeSaleFromPaystackReference(
  reference: string,
): Promise<ActionResult<{ saleId: string }>> {
  const existingSale = await getSaleByPaystackReference(reference);
  if (existingSale) return { success: true, data: { saleId: existingSale.id } };

  const verified = await verifyTransaction(reference);
  if (!verified.ok) return { success: false, error: verified.error };
  if (verified.data.status !== "success") {
    return { success: false, error: `Payment ${verified.data.status}.` };
  }

  const metadata = parsePaystackMetadata(verified.data.metadata);
  if (!metadata) {
    console.error(
      "[completeSaleFromPaystackReference] couldn't parse metadata:",
      verified.data.metadata,
    );
    return { success: false, error: "Missing order details for this payment." };
  }

  const customerId = await findOrCreateCustomer(
    metadata.shopId,
    metadata.customerInput,
    metadata.buyerClerkUserId,
  );

  const items: CreateSaleInput["items"] = metadata.items;

  const result = await finalizeSale(
    metadata.shopId,
    metadata.cartId,
    {
      customerId,
      customerName: metadata.customerInput.name,
      saleDate: new Date().toISOString().slice(0, 10),
      paymentStatus: "paid",
      balance: 0,
      discountAmount: 0,
      items,
    },
    metadata.buyerClerkUserId ?? "storefront-checkout",
    reference,
  );

  if (!result.success) {
    // If this still fails, this log line has everything needed to see
    // exactly which field is malformed — no more guessing from a bare
    // "Invalid input" string.
    console.error(
      "[completeSaleFromPaystackReference] recordSale rejected metadata:",
      metadata,
    );
  }

  return result;
}
