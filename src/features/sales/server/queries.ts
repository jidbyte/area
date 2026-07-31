import { desc, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { sale } from "@/shared/db/schema";

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
