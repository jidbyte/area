import { notFound, redirect } from "next/navigation";

import {
  getShopBySlug,
  listProductOptionsByShop,
} from "@/features/app/stores/server/queries";
import { listCustomersByShop } from "@/features/admin/customers/server/queries";
import { SaleForm } from "@/features/admin/sales/client/sale-form";

export default async function NewSalePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const [products, customers] = await Promise.all([
    listProductOptionsByShop(shop.id),
    listCustomersByShop(shop.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Record a sale</h1>
      <p className="text-muted-foreground text-sm">
        For sales made outside the storefront — in person, by phone, and so on.
      </p>
      <SaleForm
        shopId={shop.id}
        shopSlug={shop.slug}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          code: p.code,
          sellingPrice: p.sellingPrice,
        }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
