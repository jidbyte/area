import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listPurchasesByShop } from "@/features/purchases/server/queries";
import {
  PurchasesTable,
  type PurchaseRow,
} from "@/features/purchases/client/purchases-table";

export default async function PurchasesPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const purchases = await listPurchasesByShop(shop.id);

  const rows: PurchaseRow[] = purchases.map((p) => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierName: p.supplierName,
    purchaseStatus: p.purchaseStatus,
    paymentStatus: p.paymentStatus,
    totalAmount: p.totalAmount,
    purchaseDate: p.purchaseDate.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Purchases</h1>
        <Button asChild size="sm">
          <Link href="/admin/purchases/new">New purchase order</Link>
        </Button>
      </div>
      <PurchasesTable currency={shop.currency} purchases={rows} />
    </div>
  );
}
