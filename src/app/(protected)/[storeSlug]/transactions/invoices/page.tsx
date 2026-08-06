import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listInvoicesByShop } from "@/features/admin/invoices/server/actions";
import { listSalesByShop } from "@/features/admin/sales/server/queries";
import { InvoicesTable } from "@/features/admin/invoices/client/invoices-table";
import { CreateInvoiceDialog } from "@/features/admin/invoices/client/create-invoice-dialog";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const [invoices, sales] = await Promise.all([
    listInvoicesByShop(shop.id),
    listSalesByShop(shop.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Invoices</h1>
          <p className="text-sm text-neutral">
            Generate, send, and track invoices for your sales.
          </p>
        </div>
        <CreateInvoiceDialog
          shopId={shop.id}
          sales={sales.map((s) => ({
            id: s.id,
            saleNumber: s.saleNumber,
            customerName: s.customerName,
          }))}
        />
      </div>

      <InvoicesTable currency={shop.currency} invoices={invoices} />
    </div>
  );
}
