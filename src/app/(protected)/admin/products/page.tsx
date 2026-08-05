import { redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listProductsByShop } from "@/features/inventory/server/queries";
import { ProductsPageClient } from "@/features/inventory/client/products-page";
import { ProductRow } from "@/features/inventory/client/products-table";
import { ProductsEmptyState } from "@/features/inventory/client/no-products";

export default async function ProductsPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const products = await listProductsByShop(shop.id);

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
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
        <ProductsEmptyState />
      </div>
    );
  }

  return <ProductsPageClient currency={shop.currency} products={rows} />;
}
