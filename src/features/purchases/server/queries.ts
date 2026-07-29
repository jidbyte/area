import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/shared/db";
import { product, purchase } from "@/shared/db/schema";

export async function listPurchasesByShop(shopId: string) {
  return db.query.purchase.findMany({
    where: eq(purchase.shopId, shopId),
    orderBy: [desc(purchase.createdAt)],
  });
}

export async function getPurchaseById(purchaseId: string) {
  return db.query.purchase.findFirst({
    where: eq(purchase.id, purchaseId),
    with: { items: true, supplier: true },
  });
}

export async function listProductOptionsByShop(shopId: string) {
  return db.query.product.findMany({
    where: and(eq(product.shopId, shopId), isNull(product.deletedAt)),
    orderBy: [desc(product.createdAt)],
    columns: { id: true, name: true, sku: true, code: true, cost: true, price: true },
  });
}
