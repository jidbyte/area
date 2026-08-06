import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/shared/db";
import { product, shop, appUser, accountMember } from "@/shared/db/schema";

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
 * Resolves the signed-in user's own shop — the one they own (Owner role),
 * not just any shop they're a member of. Looked up via our own
 * account_member/role tables now, not Clerk org membership, since a user
 * can hold different roles across several accounts (see schema/users.ts).
 * "Each business account owns at most one shop" is still an
 * application-level rule, enforced by completeSetup checking for an
 * existing Owner membership before ever creating another one.
 */
export async function getShopForCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.query.appUser.findFirst({
    where: eq(appUser.clerkUserId, userId),
    columns: { id: true },
  });
  if (!user) return null;

  const memberships = await db.query.accountMember.findMany({
    where: eq(accountMember.userId, user.id),
    with: { role: { columns: { name: true } }, account: true },
  });

  const owned = memberships.find((m) => m.role.name === "Owner");
  return owned?.account ?? null;
}

/**
 * All accounts (stores) the signed-in user belongs to, with their role in
 * each — powers the workspace switcher ("Personal Store (Owner)",
 * "ABC Company (Editor)", etc.).
 */
export async function listAccountsForCurrentUser() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await db.query.appUser.findFirst({
    where: eq(appUser.clerkUserId, userId),
    columns: { id: true },
  });
  if (!user) return [];

  const memberships = await db.query.accountMember.findMany({
    where: eq(accountMember.userId, user.id),
    with: { role: { columns: { name: true } }, account: true },
  });

  return memberships
    .filter((m) => m.account && !m.account.deletedAt)
    .map((m) => ({
      account: m.account,
      role: m.role.name,
    }));
}

export async function listProductOptionsByShop(shopId: string) {
  return db.query.product.findMany({
    where: and(eq(product.shopId, shopId), isNull(product.deletedAt)),
    orderBy: [desc(product.createdAt)],
    columns: {
      id: true,
      name: true,
      sku: true,
      code: true,
      costPrice: true,
      sellingPrice: true,
    },
  });
}
