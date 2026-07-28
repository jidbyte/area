import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/shops/server/queries";

export default async function ShopStorefrontPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">{shop.name}-Shop</h1>
      {shop.description && <p className="text-muted-foreground mt-2">{shop.description}</p>}
      <p className="text-muted-foreground mt-6 text-sm">
        Product listings arrive in the Storefront phase.
      </p>
    </div>
  );
}
