"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { addToCart } from "@/features/app/payments/server/cart-actions";
import { useGuestCartStore } from "@/features/app/payments/client/guest-cart-store";

export function AddToCartButton({
  shopId,
  shopSlug,
  productId,
  productName,
  sellingPrice,
  imageUrl,
  maxQuantity,
  showQuantitySelector = false,
}: {
  shopId: string;
  shopSlug: string;
  productId: string;
  productName: string;
  sellingPrice: number;
  imageUrl: string | null;
  maxQuantity: number;
  showQuantitySelector?: boolean;
}) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useActionTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  if (maxQuantity <= 0) {
    return (
      <Button size="sm" disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  function handleAdd(e: React.MouseEvent) {
    // ProductCard wraps this in a Link — never let the click bubble into a navigation.
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    // Guests never hit the server for this — the cart lives entirely in
    // the zustand store (persisted to localStorage) until checkout, where
    // it gets synced into a real server cart. Signed-in buyers keep using
    // the existing server-backed cart, unchanged.
    if (isLoaded && !isSignedIn) {
      addGuestItem(
        shopId,
        shopSlug,
        { productId, name: productName, sellingPrice, imageUrl, maxQuantity },
        quantity,
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      return;
    }

    startTransition(async () => {
      const result = await addToCart(shopId, shopSlug, productId, quantity);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 1500);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {showQuantitySelector && (
          <Input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onClick={(e) => e.preventDefault()}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-16"
          />
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={isPending} loading={isPending}
          className="flex-1"
        >
          {isPending ? "Adding..." : added ? "Added" : "Add to cart"}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
