import { desc, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { purchase } from "@/shared/db/schema";

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
