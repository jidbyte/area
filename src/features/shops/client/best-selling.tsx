import {
  ProductCard,
  type StorefrontProduct,
} from "@/features/inventory/client/product-card";
import { SectionTitle } from "./section-title";

export function BestSelling({
  shopId,
  shopSlug,
  currency,
  products,
  totalSoldCount,
  ratings,
}: {
  shopId: string;
  shopSlug: string;
  currency: string;
  products: StorefrontProduct[];
  totalSoldCount: number;
  ratings: Map<string, { averageRating: number; reviewCount: number }>;
}) {
  if (products.length === 0) return null;

  return (
    <div className="mx-auto my-8 md:my-20">
      <SectionTitle
        title="Best Sellers"
        description={`Showing ${products.length} of ${totalSoldCount} best-selling product${totalSoldCount === 1 ? "" : "s"}`}
        href="#products"
      />

      <div className="mt-8 grid grid-cols-2 gap-4 lg:gap-8 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            shopId={shopId}
            shopSlug={shopSlug}
            currency={currency}
            product={product}
            rating={ratings.get(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
