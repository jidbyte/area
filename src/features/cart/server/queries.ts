import { and, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { cart } from "@/shared/db/schema";
import type { BuyerIdentity } from "./identity";

function identityWhere(shopId: string, identity: BuyerIdentity) {
  if (identity.buyerClerkUserId) {
    return and(
      eq(cart.shopId, shopId),
      eq(cart.buyerClerkUserId, identity.buyerClerkUserId),
    );
  }
  if (identity.guestId) {
    return and(eq(cart.shopId, shopId), eq(cart.guestId, identity.guestId));
  }
  return null;
}

export async function getCartRecord(shopId: string, identity: BuyerIdentity) {
  const where = identityWhere(shopId, identity);
  if (!where) return null;
  return db.query.cart.findFirst({ where });
}

export async function getCartWithItems(
  shopId: string,
  identity: BuyerIdentity,
) {
  const where = identityWhere(shopId, identity);
  if (!where) return null;

  return db.query.cart.findFirst({
    where,
    with: {
      items: {
        with: { product: { with: { images: true } } },
      },
    },
  });
}

export async function getCartItemCount(
  shopId: string,
  identity: BuyerIdentity,
): Promise<number> {
  const cartWithItems = await getCartWithItems(shopId, identity);
  if (!cartWithItems) return 0;
  return cartWithItems.items.reduce((sum, item) => sum + item.quantity, 0);
}
