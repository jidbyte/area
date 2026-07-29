import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listSalesByShop } from "@/features/sales/server/queries";
import { SalesTable, type SaleRow } from "@/features/sales/client/sales-table";

export default async function SalesPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

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
          <Link href="/admin/sales/new">Record sale</Link>
        </Button>
      </div>
      <SalesTable currency={shop.currency} sales={rows} />
    </div>
  );
}
