import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/shared/components/ui/card";

export type StorefrontShop = {
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
};

export function ShopCard({ shop }: { shop: StorefrontShop }) {
  return (
    <Link href={`/stores/${shop.slug}`}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardContent className="flex items-start gap-3">
          {shop.logo ? (
            <div className="bg-secondary relative size-12 shrink-0 overflow-hidden rounded-md">
              <Image
                src={shop.logo}
                alt={shop.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-secondary text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md text-lg font-semibold">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium">{shop.name}</p>
            {shop.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {shop.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
