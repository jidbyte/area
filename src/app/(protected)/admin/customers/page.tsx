import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listCustomersByShop } from "@/features/customers/server/queries";
import { CustomersTable } from "@/features/customers/client/customers-table";

export default async function CustomersPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const customers = await listCustomersByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <Button asChild size="sm">
          <Link href="/admin/customers/new">Add customer</Link>
        </Button>
      </div>
      <CustomersTable customers={customers} />
    </div>
  );
}
