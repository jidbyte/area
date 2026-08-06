import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { GlobalNav } from "@/shared/components/app/global-nav";
import { getShopForCurrentUser } from "@/features/app/stores/server/queries";
import {
  countActiveProducts,
  getPlatformRankedBySales,
  getPlatformLatestProducts,
} from "@/features/app/catalog/server/queries";
import { ProductGridSection } from "@/features/app/catalog/client/product-grid-section";

export const dynamic = "force-dynamic";

const MANY_PRODUCTS_THRESHOLD = 30;

// Per spec: /shop and /shop/[userId] render the same catalog content — the
// difference is just the profile-owner extras (switch-to-store link, link
// to order history) shown above the shared catalog.
export default async function BuyerShopPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: profileClerkUserId } = await params;
  const { userId: viewerClerkUserId } = await auth();
  const isOwnProfile = viewerClerkUserId === profileClerkUserId;
  const ownedShop = isOwnProfile ? await getShopForCurrentUser() : null;

  const totalActive = await countActiveProducts();
  const manyProducts = totalActive >= MANY_PRODUCTS_THRESHOLD;
  const sectionSize = manyProducts ? 15 : 8;

  const bestSelling = await getPlatformRankedBySales(sectionSize, 0);
  const featured = await getPlatformRankedBySales(sectionSize, sectionSize);
  const excludeIds = [...bestSelling, ...featured].map((p) => p.id);
  const latest = await getPlatformLatestProducts(sectionSize, excludeIds);

  return (
    <div>
      <GlobalNav />
      <div className="mx-auto max-w-6xl p-4 md:px-12">
        {isOwnProfile && (
          <div className="flex items-center justify-between border-b border-muted/40 py-4">
            <div>
              <p className="font-medium text-ink">Your account</p>
              <Link href="/all-orders" className="text-sm text-primary hover:underline">
                View your orders
              </Link>
            </div>
            {ownedShop && (
              <Link href={`/${ownedShop.slug}/dashboard`} className="text-sm text-primary hover:underline">
                Switch to store dashboard
              </Link>
            )}
          </div>
        )}

        <ProductGridSection title="Best selling" products={bestSelling} manyProducts={manyProducts} />
        <ProductGridSection title="Featured" products={featured} manyProducts={manyProducts} />
        <ProductGridSection title="Latest arrivals" products={latest} manyProducts={manyProducts} />
      </div>
    </div>
  );
}
