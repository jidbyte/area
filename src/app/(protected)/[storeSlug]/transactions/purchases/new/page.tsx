import { notFound, redirect } from "next/navigation";

import {
  getShopBySlug,
  listProductOptionsByShop,
} from "@/features/app/stores/server/queries";
import { listSuppliersByShop } from "@/features/admin/suppliers/server/queries";
import { PurchaseForm } from "@/features/admin/purchases/client/purchase-form";

export default async function NewPurchasePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const [products, suppliers] = await Promise.all([
    listProductOptionsByShop(shop.id),
    listSuppliersByShop(shop.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New purchase order</h1>
      <PurchaseForm
        shopId={shop.id}
        shopSlug={shop.slug}
        products={products}
        suppliers={suppliers.map((s) => ({
          id: s.id,
          companyName: s.companyName,
        }))}
      />
    </div>
  );
}
