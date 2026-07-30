import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

const GUEST_ID_COOKIE = "area_guest_id";
const GUEST_ID_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type BuyerIdentity = {
  buyerClerkUserId: string | null;
  guestId: string | null;
};

/**
 * Read-only — safe to call from Server Components (product pages, the
 * header's cart badge). Never mints a new guest cookie, since Server
 * Components can't set cookies; if no cart has been started yet, this
 * correctly reports "no identity" and callers should treat that as an
 * empty cart.
 */
export async function resolveBuyerIdentity(): Promise<BuyerIdentity> {
  const { userId } = await auth();
  if (userId) return { buyerClerkUserId: userId, guestId: null };

  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value ?? null;
  return { buyerClerkUserId: null, guestId };
}

/**
 * Mutating — only call from Server Actions/Route Handlers. Mints and sets a
 * guest cookie on first use if the buyer isn't signed in and doesn't have
 * one yet.
 */
export async function resolveOrCreateBuyerIdentity(): Promise<BuyerIdentity> {
  const { userId } = await auth();
  if (userId) return { buyerClerkUserId: userId, guestId: null };

  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value;
  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_ID_COOKIE, guestId, {
      maxAge: GUEST_ID_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return { buyerClerkUserId: null, guestId };
}
