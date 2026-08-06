import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/shared/db";
import { supplier } from "@/shared/db/schema";

export async function listSuppliersByShop(shopId: string) {
  return db.query.supplier.findMany({
    where: and(eq(supplier.shopId, shopId), isNull(supplier.deletedAt)),
    orderBy: [asc(supplier.companyName)],
  });
}

export async function getSupplierById(supplierId: string) {
  return db.query.supplier.findFirst({ where: eq(supplier.id, supplierId) });
}
