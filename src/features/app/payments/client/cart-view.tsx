"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { placeholderAssets } from "@/assets/placeholder";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatPrice } from "@/shared/utils/currency";
import {
  updateCartItemQuantity,
  removeCartItem,
} from "@/features/app/payments/server/cart-actions";

export type CartLineItem = {
  id: string;
  productId: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  maxQuantity: number;
  imageUrl: string | null;
};

export function CartView({
  shopSlug,
  currency,
  items,
}: {
  shopSlug: string;
  currency: string;
  items: CartLineItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0,
  );

  function handleQuantityChange(cartItemId: string, quantity: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemQuantity(
        cartItemId,
        shopSlug,
        quantity,
      );
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function handleRemove(cartItemId: string) {
    setError(null);
    startTransition(async () => {
      await removeCartItem(cartItemId, shopSlug);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Link
          href={`/stores/${shopSlug}`}
          className="text-primary text-sm hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 border-b pb-4">
          <div className="bg-secondary relative size-16 shrink-0 overflow-hidden rounded-md">
            <Image
              src={item.imageUrl || placeholderAssets.noImage}
              alt={item.name}
              fill
              unoptimized={!!item.imageUrl}
              className="object-contain p-2"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatPrice(item.sellingPrice, currency)} each
            </p>
          </div>
          <Input
            type="number"
            min={1}
            max={item.maxQuantity}
            defaultValue={item.quantity}
            disabled={isPending}
            className="w-16"
            onChange={(e) =>
              handleQuantityChange(item.id, Number(e.target.value))
            }
          />
          <p className="w-20 text-right text-sm font-medium">
            {formatPrice(item.quantity * item.sellingPrice, currency)}
          </p>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending} loading={isPending}
            onClick={() => handleRemove(item.id)}
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center justify-between pt-2 text-lg font-semibold">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal, currency)}</span>
      </div>

      <Button asChild className="w-full">
        <Link href={`/stores/${shopSlug}/checkout`}>Proceed to checkout</Link>
      </Button>
    </div>
  );
}
