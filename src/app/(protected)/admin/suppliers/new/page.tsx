import { redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { SupplierForm } from "@/features/suppliers/client/supplier-form";

export default async function NewSupplierPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add supplier</h1>
      <SupplierForm shopId={shop.id} />
    </div>
  );
}
