import { notFound } from "next/navigation";
import Link from "next/link";

import { getShopBySlug } from "@/features/shops/server/queries";
import {
  listActiveProductsByShop,
  searchActiveProductsByShop,
} from "@/features/inventory/server/queries";
import { ProductCard, type StorefrontProduct } from "@/features/inventory/client/product-card";
import { ShopHeader } from "@/features/shops/client/shop-header";

export const dynamic = "force-dynamic";

export default async function ShopStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { shop: slug } = await params;
  const { q } = await searchParams;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const allProducts = await listActiveProductsByShop(shop.id);
  const products = q ? await searchActiveProductsByShop(shop.id, q) : allProducts;

  // Category pills always reflect the full catalog, not the filtered search
  // results, so a search doesn't make categories disappear from the nav.
  const categories = Array.from(
    new Set(allProducts.flatMap((p) => p.productCategories.map((pc) => pc.category.name))),
  ).sort();

  const rows: StorefrontProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    primaryImageUrl: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
  }));

  return (
    <div>
      <ShopHeader slug={slug} name={shop.name} showSearch initialQuery={q ?? ""} />

      <div className="mx-auto max-w-5xl p-8">
        {shop.description && <p className="text-muted-foreground mb-6">{shop.description}</p>}

        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/${slug}/category/${encodeURIComponent(c)}`}
                className="bg-secondary hover:bg-accent rounded-full px-3 py-1 text-xs font-medium"
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {q
              ? `No products match "${q}".`
              : "This shop hasn't listed any products yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((product) => (
              <ProductCard
                key={product.id}
                shopSlug={slug}
                currency={shop.currency}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
