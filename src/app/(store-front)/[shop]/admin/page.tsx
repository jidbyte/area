import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/shops/server/queries";

export default async function ShopAdminOverviewPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">{shop.name} — admin</h1>
      <p className="text-muted-foreground text-sm capitalize">
        Status: {shop.status}
      </p>
      <p className="text-muted-foreground mt-6 text-sm">
        Product/inventory management arrives in the next phase.
      </p>
    </div>
  );
}
