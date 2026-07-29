import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/shared/db";
import { customer } from "@/shared/db/schema";

export async function listCustomersByShop(shopId: string) {
  return db.query.customer.findMany({
    where: and(eq(customer.shopId, shopId), isNull(customer.deletedAt)),
    orderBy: [asc(customer.name)],
  });
}

export async function getCustomerById(customerId: string) {
  return db.query.customer.findFirst({ where: eq(customer.id, customerId) });
}
