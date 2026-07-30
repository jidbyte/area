"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { addToCart } from "@/features/cart/server/actions";

export function AddToCartButton({
  shopId,
  shopSlug,
  productId,
  maxQuantity,
  showQuantitySelector = false,
}: {
  shopId: string;
  shopSlug: string;
  productId: string;
  maxQuantity: number;
  showQuantitySelector?: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
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
          size="sm"
          onClick={handleAdd}
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? "Adding..." : added ? "Added" : "Add to cart"}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
