import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { db } from "@/shared/db";
import { product, shop } from "@/shared/db/schema";

export async function getShopBySlug(slug: string) {
  return db.query.shop.findFirst({
    where: and(eq(shop.slug, slug), isNull(shop.deletedAt)),
  });
}

export async function getShopById(id: string) {
  return db.query.shop.findFirst({ where: eq(shop.id, id) });
}

export async function getShopByOrgId(clerkOrgId: string) {
  return db.query.shop.findFirst({ where: eq(shop.clerkOrgId, clerkOrgId) });
}

export async function listShops() {
  return db.query.shop.findMany({
    where: and(eq(shop.isActive, true), isNull(shop.deletedAt)),
    orderBy: [desc(shop.createdAt)],
  });
}

/** Name match (partial, case-insensitive) OR exact slug match ("unique shop id"). */
export async function searchShops(query: string) {
  const q = query.trim();
  if (!q) return listShops();
  return db.query.shop.findMany({
    where: and(
      eq(shop.isActive, true),
      isNull(shop.deletedAt),
      or(ilike(shop.name, `%${q}%`), eq(shop.slug, q)),
    ),
    orderBy: [desc(shop.createdAt)],
  });
}

/**
 * Resolves the signed-in user's own shop — each account has at most one.
 * Looked up via actual Clerk org membership (not the session's "active org"),
 * so it's correct even before the client has ever selected an org.
 */
export async function getShopForCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const { data: memberships } =
    await client.users.getOrganizationMembershipList({ userId });
  const orgId = memberships[0]?.organization.id;
  if (!orgId) return null;

  return getShopByOrgId(orgId);
}
