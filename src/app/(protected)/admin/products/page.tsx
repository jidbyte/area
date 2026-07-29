import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listProductsByShop } from "@/features/inventory/server/queries";
import { ProductsTable, type ProductRow } from "@/features/inventory/client/products-table";

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
    primaryImageUrl: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
    categories: p.productCategories.map((pc) => pc.category.name),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>
      <ProductsTable currency={shop.currency} products={rows} />
    </div>
  );
}
