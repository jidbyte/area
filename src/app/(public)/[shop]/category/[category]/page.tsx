import { notFound } from "next/navigation";
import Link from "next/link";

import { getShopBySlug } from "@/features/shops/server/queries";
import { listActiveProductsByShopAndCategory } from "@/features/inventory/server/queries";
import { ProductCard, type StorefrontProduct } from "@/features/inventory/client/product-card";
import { ShopHeader } from "@/features/shops/client/shop-header";
import { getReviewSummariesForProducts } from "@/features/reviews/server/queries";

export const dynamic = "force-dynamic";

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ shop: string; category: string }>;
}) {
  const { shop: slug, category } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const categoryName = decodeURIComponent(category);
  const products = await listActiveProductsByShopAndCategory(shop.id, categoryName);

  const rows: StorefrontProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    primaryImageUrl: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
  }));

    const ratings = await getReviewSummariesForProducts(rows.map((p) => p.id));


  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />

      <div className="mx-auto max-w-5xl p-8">
        <Link
          href={`/${slug}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to {shop.name}
        </Link>

        <h1 className="mt-4 mb-6 text-2xl font-semibold">{categoryName}</h1>

        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No products in this category right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((product) => (
              <ProductCard
                key={product.id}
                shopId={shop.id}
                shopSlug={slug}
                currency={shop.currency}
                product={product}
                rating={ratings.get(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
