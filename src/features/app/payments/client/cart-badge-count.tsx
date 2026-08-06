"use client";

import { useUser } from "@clerk/nextjs";
import { useGuestCartStore } from "./guest-cart-store";

/**
 * Signed-in buyers: trust the server-computed count passed in as
 * `initialCount` — their cart lives in the DB, no client state needed.
 * Guests: the DB cart no longer reflects reality (guests never write to it
 * until checkout), so override with the live zustand count for this shop.
 */
export function CartBadgeCount({
  shopId,
  initialCount,
}: {
  shopId: string;
  initialCount: number;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const guestItems = useGuestCartStore((s) => s.carts[shopId]?.items ?? []);

  if (!isLoaded) {
    return initialCount > 0 ? (
      <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-black text-white text-[9px] font-medium">
        {initialCount > 9 ? "9+" : initialCount}
      </span>
    ) : null;
  }

  const count = isSignedIn
    ? initialCount
    : guestItems.reduce((sum, i) => sum + i.quantity, 0);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-black text-white text-[9px] font-medium">
      {count > 9 ? "9+" : count}
    </span>
  );
}
