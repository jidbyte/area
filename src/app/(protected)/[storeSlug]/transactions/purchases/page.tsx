import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listPurchasesByShop } from "@/features/admin/purchases/server/queries";
import {
  PurchasesTable,
  type PurchaseRow,
} from "@/features/admin/purchases/client/purchases-table";

export default async function PurchasesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

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
          <Link href={`/${storeSlug}/transactions/purchases/new`}>New purchase order</Link>
        </Button>
      </div>
      <PurchasesTable currency={shop.currency} purchases={rows} shopSlug={storeSlug} />
    </div>
  );
}
