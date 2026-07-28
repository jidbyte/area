import { auth } from "@clerk/nextjs/server";

import { getShopById } from "./queries";
import { isMemberOfShopOrg } from "./membership";

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
 * must independently verify the caller belongs to that shop's organization.
 */
export async function requireShopMembership(
  shopId: string,
): Promise<ShopAuthResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const shop = await getShopById(shopId);
  if (!shop) return { ok: false, error: "Shop not found." };

  const isMember = await isMemberOfShopOrg(userId, shop.clerkOrgId);
  if (!isMember)
    return { ok: false, error: "You don't have access to this shop." };

  return { ok: true, userId, shop };
}
