import Image from "next/image";
import Link from "next/link";

import { placeholderAssets } from "@/assets/placeholder";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatPrice } from "@/shared/utils/currency";
import { AddToCartButton } from "@/features/app/payments/client/add-to-cart-button";
import { demoImages } from "@/assets/img";

export type StorefrontProduct = {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  primaryImageUrl: string | null;
};

export function ProductCard({
  shopId,
  shopSlug,
  currency,
  product,
  rating,
}: {
  shopId: string;
  shopSlug: string;
  currency: string;
  product: StorefrontProduct;
  /** Batch-fetched by the parent page (see getReviewSummariesForProducts) — omitted or undefined shows no badge. */
  rating?: { averageRating: number; reviewCount: number };
}) {
  const outOfStock = product.quantity <= 0;

  return (
    <div className="overflow-hidden p-2 rounded-lg transition-all hover:scale-102 hover:border hover:border-neutral hover:shadow-sm">
      <Link href={`/stores/${shopSlug}/product/${product.id}`}>
        <div className="bg-gray-50 relative aspect-square rounded-lg">
          <Image
            src={product.primaryImageUrl || placeholderAssets.noImage}
            alt={product.name}
            fill
            unoptimized={!!product.primaryImageUrl}
            className="block w-full object-cover rounded-lg"
          />

          {outOfStock && (
            <span className="bg-danger text-white absolute top-2 right-2 rounded-lg px-2 py-1 text-xs font-semibold">
              Out of stock
            </span>
          )}
        </div>

        <div className="space-y-1.5 mt-2 flex flex-col">
          <p className="truncate text-sm font-semibold">{product.name}</p>

          <div className="flex items-center justify-between">
            <p className="font-bold text-neutral tracking-wide">
              {formatPrice(product.sellingPrice, currency)}
            </p>

            <AddToCartButton
              shopId={shopId}
              shopSlug={shopSlug}
              productId={product.id}
              productName={product.name}
              sellingPrice={product.sellingPrice}
              imageUrl={product.primaryImageUrl}
              maxQuantity={product.quantity}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
