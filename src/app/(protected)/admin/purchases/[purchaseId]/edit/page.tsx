import { notFound, redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getPurchaseById, listProductOptionsByShop } from "@/features/purchases/server/queries";
import { listSuppliersByShop } from "@/features/suppliers/server/queries";
import { PurchaseForm } from "@/features/purchases/client/purchase-form";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const purchaseRecord = await getPurchaseById(purchaseId);
  if (!purchaseRecord || purchaseRecord.shopId !== shop.id) notFound();

  if (purchaseRecord.purchaseStatus !== "draft") {
    redirect(`/admin/purchases/${purchaseId}`);
  }

  const [products, suppliers] = await Promise.all([
    listProductOptionsByShop(shop.id),
    listSuppliersByShop(shop.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit purchase order</h1>
      <PurchaseForm
        shopId={shop.id}
        purchaseId={purchaseRecord.id}
        products={products}
        suppliers={suppliers.map((s) => ({
          id: s.id,
          companyName: s.companyName,
        }))}
        defaultValues={{
          supplierId: purchaseRecord.supplierId ?? "",
          supplierName: purchaseRecord.supplierName,
          purchaseDate: purchaseRecord.purchaseDate.toISOString().slice(0, 10),
          eta: purchaseRecord.eta
            ? purchaseRecord.eta.toISOString().slice(0, 10)
            : "",
          shippingCost: purchaseRecord.shippingCost,
          discountAmount: purchaseRecord.discountAmount,
          items: purchaseRecord.items.map((item) => ({
            productId: item.productId ?? "",
            productName: item.productName,
            productCode: item.productCode ?? "",
            productSku: item.productSku,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        }}
      />
    </div>
  );
}
