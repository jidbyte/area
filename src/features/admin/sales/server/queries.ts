import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/shared/db";
import { sale, customer, shop } from "@/shared/db/schema";

export async function listSalesByShop(shopId: string) {
  return db.query.sale.findMany({
    where: eq(sale.shopId, shopId),
    orderBy: [desc(sale.createdAt)],
  });
}

export async function getSaleById(saleId: string) {
  return db.query.sale.findFirst({
    where: eq(sale.id, saleId),
    with: { items: true, customer: true },
  });
}

export async function getSaleByPaystackReference(reference: string) {
  return db.query.sale.findFirst({
    where: eq(sale.paystackReference, reference),
  });
}

/**
 * A buyer's order history spans every store they've bought from — matched
 * via customer.buyerClerkUserId, which checkout sets whenever the buyer was
 * signed in at the time of purchase (see checkout/server/actions.ts
 * findOrCreateCustomer). Guest checkouts never link this, so this
 * intentionally only ever returns orders placed while signed in.
 */
export async function listOrdersForBuyer(buyerClerkUserId: string) {
  const customers = await db.query.customer.findMany({
    where: eq(customer.buyerClerkUserId, buyerClerkUserId),
    columns: { id: true, shopId: true },
  });
  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);
  const sales = await db.query.sale.findMany({
    where: inArray(sale.customerId, customerIds),
    orderBy: [desc(sale.createdAt)],
    with: { items: { with: { product: { columns: { id: true, name: true } } } } },
  });

  const shopIds = Array.from(new Set(sales.map((s) => s.shopId)));
  const shops = shopIds.length
    ? await db.query.shop.findMany({
        where: inArray(shop.id, shopIds),
        columns: { id: true, slug: true, name: true, currency: true },
      })
    : [];
  const shopById = new Map(shops.map((s) => [s.id, s]));

  return sales.map((s) => ({
    ...s,
    shop: shopById.get(s.shopId) ?? null,
  }));
}
