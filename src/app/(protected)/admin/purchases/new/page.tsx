import { redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listSuppliersByShop } from "@/features/suppliers/server/queries";
import { PurchaseForm } from "@/features/purchases/client/purchase-form";
import { listProductOptionsByShop } from "@/features/purchases/server/queries";

export default async function NewPurchasePage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const [products, suppliers] = await Promise.all([
    listProductOptionsByShop(shop.id),
    listSuppliersByShop(shop.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New purchase order</h1>
      <PurchaseForm
        shopId={shop.id}
        products={products}
        suppliers={suppliers.map((s) => ({
          id: s.id,
          companyName: s.companyName,
        }))}
      />
    </div>
  );
}
