import { notFound, redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getSaleById } from "@/features/sales/server/queries";
import { listCustomersByShop } from "@/features/customers/server/queries";
import { SaleEditForm } from "@/features/sales/client/sale-edit-form";

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const saleRecord = await getSaleById(saleId);
  if (!saleRecord || saleRecord.shopId !== shop.id) notFound();

  if (saleRecord.paymentStatus === "cancelled") {
    redirect(`/admin/sales/${saleId}`);
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
