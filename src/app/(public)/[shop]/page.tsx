import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/shops/server/queries";
import {
  listActiveProductsByShop,
  searchActiveProductsByShop,
  getBestSellingProducts,
} from "@/features/inventory/server/queries";
import {
  ProductCard,
  type StorefrontProduct,
} from "@/features/inventory/client/product-card";
import { ShopHeader } from "@/features/shops/client/shop-header";
import { getReviewSummariesForProducts } from "@/features/reviews/server/queries";
import HeroPage from "@/features/shops/client/hero-page";
import { BestSelling } from "@/features/shops/client/best-selling";
import ShopFooter from "@/features/shops/client/footer";

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
  const products = q
    ? await searchActiveProductsByShop(shop.id, q)
    : allProducts;

  // Category pills/marquee always reflect the full catalog, not the
  // filtered search results, so a search doesn't make categories disappear.
  const categories = Array.from(
    new Set(
      allProducts.flatMap((p) =>
        p.productCategories.map((pc) => pc.category.name),
      ),
    ),
  ).sort();

  const rows: StorefrontProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    primaryImageUrl:
      p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
  }));

  const ratings = await getReviewSummariesForProducts(rows.map((p) => p.id));

  const startingPrice =
    allProducts.length > 0
      ? Math.min(...allProducts.map((p) => p.price))
      : null;

  const { products: bestSellingRaw, totalSoldCount } =
    await getBestSellingProducts(shop.id);
  const bestSelling: StorefrontProduct[] = bestSellingRaw.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    primaryImageUrl:
      p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
  }));
  const bestSellingRatings = await getReviewSummariesForProducts(
    bestSelling.map((p) => p.id),
  );

  return (
    <div>
      <ShopHeader
        shopId={shop.id}
        slug={slug}
        name={shop.name}
        showSearch
        initialQuery={q ?? ""}
      />

      <div className="mx-auto p-4 md:px-12">
        {!q && (
          <>
            <HeroPage
              shopSlug={slug}
              shopName={shop.name}
              description={shop.description}
              currency={shop.currency}
              startingPrice={startingPrice}
              productCount={allProducts.length}
              categories={categories}
            />

            <BestSelling
              shopId={shop.id}
              shopSlug={slug}
              currency={shop.currency}
              products={bestSelling}
              totalSoldCount={totalSoldCount}
              ratings={bestSellingRatings}
            />

            <ShopFooter />
          </>
        )}
      </div>
    </div>
  );
}
