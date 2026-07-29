import Image from "next/image";
import Link from "next/link";

import { placeholderAssets } from "@/assets/placeholder";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatPrice } from "@/shared/utils/currency";

export type StorefrontProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  primaryImageUrl: string | null;
};

export function ProductCard({
  shopSlug,
  currency,
  product,
}: {
  shopSlug: string;
  currency: string;
  product: StorefrontProduct;
}) {
  const outOfStock = product.quantity <= 0;

  return (
    <Link href={`/${shopSlug}/product/${product.id}`}>
      <Card className="overflow-hidden py-0 transition-colors hover:border-primary">
        <div className="bg-secondary relative aspect-square">
          <Image
            src={product.primaryImageUrl || placeholderAssets.noImage}
            alt={product.name}
            fill
            unoptimized={!!product.primaryImageUrl}
            className="object-contain p-6"
          />
          {outOfStock && (
            <span className="bg-background/90 text-muted-foreground absolute top-2 right-2 rounded px-2 py-0.5 text-xs font-medium">
              Out of stock
            </span>
          )}
        </div>
        <CardContent className="px-4 py-3">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-primary text-sm font-semibold">
            {formatPrice(product.price, currency)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
