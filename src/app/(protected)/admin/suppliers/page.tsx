import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listSuppliersByShop } from "@/features/suppliers/server/queries";
import { SuppliersTable } from "@/features/suppliers/client/suppliers-table";

export default async function SuppliersPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const suppliers = await listSuppliersByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <Button asChild size="sm">
          <Link href="/admin/suppliers/new">Add supplier</Link>
        </Button>
      </div>
      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
