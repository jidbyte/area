"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { placeholderAssets } from "@/assets/placeholder";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatPrice } from "@/shared/utils/currency";
import { useGuestCartStore } from "./guest-cart-store";

export function GuestCartView({
  shopId,
  shopSlug,
  currency,
}: {
  shopId: string;
  shopSlug: string;
  currency: string;
}) {
  const shopCart = useGuestCartStore((s) => s.carts[shopId]);
  const updateQuantity = useGuestCartStore((s) => s.updateQuantity);
  const removeItem = useGuestCartStore((s) => s.removeItem);

  const items = shopCart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Link href={`/stores/${shopSlug}`} className="text-primary text-sm hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.productId} className="flex items-center gap-4 border-b pb-4">
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
            className="w-16"
            onChange={(e) => updateQuantity(shopId, item.productId, Number(e.target.value))}
          />
          <p className="w-20 text-right text-sm font-medium">
            {formatPrice(item.quantity * item.sellingPrice, currency)}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(shopId, item.productId)}
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 text-lg font-semibold">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal, currency)}</span>
      </div>

      <Button asChild className="w-full">
        <Link href={`/stores/${shopSlug}/checkout`}>Proceed to checkout</Link>
      </Button>
      <p className="text-center text-xs text-neutral">
        You'll be asked to sign in or continue as a guest at checkout.
      </p>
    </div>
  );
}
