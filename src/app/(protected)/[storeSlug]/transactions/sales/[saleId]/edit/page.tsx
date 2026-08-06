import { notFound, redirect } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getSaleById } from "@/features/admin/sales/server/queries";
import { listCustomersByShop } from "@/features/admin/customers/server/queries";
import { SaleEditForm } from "@/features/admin/sales/client/sale-edit-form";

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ storeSlug: string; saleId: string }>;
}) {
  const { storeSlug, saleId } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const saleRecord = await getSaleById(saleId);
  if (!saleRecord || saleRecord.shopId !== shop.id) notFound();

  if (saleRecord.paymentStatus === "cancelled") {
    redirect(`/${storeSlug}/transactions/sales/${saleId}`);
  }

  const customers = await listCustomersByShop(shop.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit sale</h1>
      <p className="text-muted-foreground text-sm">
        Items can&apos;t be changed after a sale is recorded — cancel and record
        a new one if needed.
      </p>
      <SaleEditForm
        saleId={saleRecord.id}
        shopSlug={storeSlug}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        defaultValues={{
          customerId: saleRecord.customerId ?? "",
          customerName: saleRecord.customerName,
          saleDate: saleRecord.saleDate.toISOString().slice(0, 10),
          discountAmount: saleRecord.discountAmount,
        }}
      />
    </div>
  );
}
