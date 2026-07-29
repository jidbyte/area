import { redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { CustomerForm } from "@/features/customers/client/customer-form";

export default async function NewCustomerPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add customer</h1>
      <CustomerForm shopId={shop.id} />
    </div>
  );
}
