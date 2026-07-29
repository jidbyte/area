import { notFound, redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getCustomerById } from "@/features/customers/server/queries";
import { CustomerForm } from "@/features/customers/client/customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const customerRecord = await getCustomerById(customerId);
  if (!customerRecord || customerRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit customer</h1>
      <CustomerForm
        shopId={shop.id}
        customerId={customerRecord.id}
        defaultValues={{
          name: customerRecord.name,
          customerType: customerRecord.customerType as
            "individual" | "business",
          email: customerRecord.email ?? "",
          phone: customerRecord.phone ?? "",
          address: customerRecord.address ?? "",
        }}
      />
    </div>
  );
}
