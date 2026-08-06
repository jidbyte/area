import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listProductsByShop } from "@/features/admin/products/server/queries";
import { ProductsPageClient } from "@/features/admin/products/client/products-page";
import { ProductRow } from "@/features/admin/products/client/products-table";
import { ProductsEmptyState } from "@/features/admin/products/client/no-products";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const products = await listProductsByShop(shop.id);

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    sellingPrice: p.sellingPrice,
    quantity: p.quantity,
    restockLevel: p.restockLevel,
    isActive: p.isActive,
    primaryImageUrl:
      p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
    categories: p.productCategories.map((pc) => pc.category.name),
  }));

  if (products.length === 0) {
    return (
      <div className="space-y-4 mt-4 md:mt-8">
        <ProductsEmptyState shopSlug={storeSlug} />
      </div>
    );
  }

  return (
    <ProductsPageClient
      currency={shop.currency}
      products={rows}
      shopSlug={storeSlug}
    />
  );
}
