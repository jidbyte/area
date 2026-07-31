import { redirect } from "next/navigation";

import {
  getShopForCurrentUser,
  listProductOptionsByShop,
} from "@/features/shops/server/queries";
import { listCustomersByShop } from "@/features/customers/server/queries";
import { SaleForm } from "@/features/sales/client/sale-form";

export default async function NewSalePage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

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
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          code: p.code,
          price: p.price,
        }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
