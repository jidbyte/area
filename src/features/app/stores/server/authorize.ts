import { auth } from "@clerk/nextjs/server";

import { getShopById } from "./queries";
import { isMemberOfAccount } from "./membership";
import { can } from "@/shared/authz/can";
import type { PermissionKey } from "@/shared/db/schema/users";

export type ShopAuthResult =
  | {
      ok: true;
      userId: string;
      shop: NonNullable<Awaited<ReturnType<typeof getShopById>>>;
    }
  | { ok: false; error: string };

/**
 * Server actions are directly callable endpoints — a page-level layout guard
 * doesn't protect them. Every action that mutates a specific shop's data
 * must independently verify the caller belongs to that shop's account.
 *
 * This checks *membership only* (any role) — matches the pre-RBAC behavior
 * so every existing call site keeps working unchanged. For actions that need
 * a specific permission (not just "any member"), use requireShopPermission
 * below instead.
 */
export async function requireShopMembership(
  shopId: string,
): Promise<ShopAuthResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const shop = await getShopById(shopId);
  if (!shop) return { ok: false, error: "Shop not found." };

  const isMember = await isMemberOfAccount(userId, shopId);
  if (!isMember)
    return { ok: false, error: "You don't have access to this shop." };

  return { ok: true, userId, shop };
}

/**
 * Permission-scoped variant — use this for actions that should be
 * restricted to specific roles (e.g. only Owner/Admin can invite users or
 * manage billing), rather than any member of the account.
 */
export async function requireShopPermission(
  shopId: string,
  permissionKey: PermissionKey,
): Promise<ShopAuthResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const shop = await getShopById(shopId);
  if (!shop) return { ok: false, error: "Shop not found." };

  const allowed = await can(userId, shopId, permissionKey);
  if (!allowed)
    return { ok: false, error: "You don't have permission to do that." };

  return { ok: true, userId, shop };
}
