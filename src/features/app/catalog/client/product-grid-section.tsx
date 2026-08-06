import { ProductCard, type StorefrontProduct } from "@/features/admin/products/client/product-card";
import type { CatalogProduct } from "@/features/app/catalog/server/queries";
import { cn } from "@/shared/lib/utils";

// Column counts per spec: sm=2, md=3, lg=5 when the platform has 30+ active
// products; lg drops to 4 (same sm/md) below that threshold, since a 5-wide
// grid looks sparse with only a handful of products.
export function ProductGridSection({
  title,
  products,
  manyProducts,
}: {
  title: string;
  products: CatalogProduct[];
  manyProducts: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="mb-4 text-xl font-bold text-ink md:text-2xl">{title}</h2>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 gap-y-6",
          manyProducts ? "lg:grid-cols-5" : "lg:grid-cols-4",
        )}
      >
        {products.map((p) => {
          const storefrontProduct: StorefrontProduct = {
            id: p.id,
            name: p.name,
            sellingPrice: p.sellingPrice,
            quantity: p.quantity,
            primaryImageUrl: p.primaryImageUrl,
          };
          return (
            <ProductCard
              key={p.id}
              shopId={p.shopId}
              shopSlug={p.shopSlug}
              currency={p.currency}
              product={storefrontProduct}
            />
          );
        })}
      </div>
    </section>
  );
}
