import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listCustomersByShop } from "@/features/admin/customers/server/queries";
import { CustomersTable } from "@/features/admin/customers/client/customers-table";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const customers = await listCustomersByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <Button asChild size="sm">
          <Link href={`/${storeSlug}/customers/new`}>Add customer</Link>
        </Button>
      </div>
      <CustomersTable customers={customers} shopSlug={storeSlug} />
    </div>
  );
}
