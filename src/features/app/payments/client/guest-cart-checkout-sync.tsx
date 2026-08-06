"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useGuestCartStore } from "./guest-cart-store";
import { syncGuestCartToServer } from "@/features/app/payments/server/cart-actions";

/**
 * Rendered only when the server-side checkout page found an empty DB cart.
 * That's expected for guests now — their cart lives in zustand until this
 * exact moment. Syncs it into the DB, clears the local copy, then refreshes
 * so the server component re-renders with the now-populated cart. If
 * zustand is also empty (a genuinely empty cart, or a signed-in user who
 * never had one), sends them back to the cart page instead.
 */
export function GuestCartCheckoutSync({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const router = useRouter();
  const shopCart = useGuestCartStore((s) => s.carts[shopId]);
  const clearShopCart = useGuestCartStore((s) => s.clearShopCart);
  const [status, setStatus] = useState<"checking" | "syncing">("checking");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const items = shopCart?.items ?? [];
    if (items.length === 0) {
      router.replace(`/stores/${shopSlug}/cart`);
      return;
    }

    setStatus("syncing");
    syncGuestCartToServer(
      shopId,
      shopSlug,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    ).then(() => {
      clearShopCart(shopId);
      router.refresh();
    });
    // Deliberately runs once on mount only — shopCart is read at that
    // point via the ref guard above, not tracked as a reactive dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className="text-sm text-neutral">
      {status === "syncing" ? "Preparing checkout..." : "Loading your cart..."}
    </p>
  );
}
