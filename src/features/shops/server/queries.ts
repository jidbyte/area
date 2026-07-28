import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { shop } from "@/db/schema";

export async function getShopBySlug(slug: string) {
  return db.query.shop.findFirst({ where: eq(shop.slug, slug) });
}

export async function getShopById(id: string) {
  return db.query.shop.findFirst({ where: eq(shop.id, id) });
}

export async function getShopByOrgId(clerkOrgId: string) {
  return db.query.shop.findFirst({ where: eq(shop.clerkOrgId, clerkOrgId) });
}

export async function listShops(status?: "pending" | "approved" | "suspended") {
  return db.query.shop.findMany({
    where: status ? eq(shop.status, status) : undefined,
    orderBy: [desc(shop.createdAt)],
  });
}
