import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listSalesByShop } from "@/features/admin/sales/server/queries";
import { SalesTable, type SaleRow } from "@/features/admin/sales/client/sales-table";

export default async function SalesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const sales = await listSalesByShop(shop.id);

  const rows: SaleRow[] = sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    customerName: s.customerName,
    paymentStatus: s.paymentStatus,
    totalAmount: s.totalAmount,
    balance: s.balance,
    saleDate: s.saleDate.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales</h1>
        <Button asChild size="sm">
          <Link href={`/${storeSlug}/transactions/sales/new`}>Record sale</Link>
        </Button>
      </div>
      <SalesTable currency={shop.currency} sales={rows} shopSlug={storeSlug} />
    </div>
  );
}
