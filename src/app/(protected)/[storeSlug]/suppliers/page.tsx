import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listSuppliersByShop } from "@/features/admin/suppliers/server/queries";
import { SuppliersTable } from "@/features/admin/suppliers/client/suppliers-table";

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const suppliers = await listSuppliersByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <Button asChild size="sm">
          <Link href={`/${storeSlug}/suppliers/new`}>Add supplier</Link>
        </Button>
      </div>
      <SuppliersTable suppliers={suppliers} shopSlug={storeSlug} />
    </div>
  );
}
