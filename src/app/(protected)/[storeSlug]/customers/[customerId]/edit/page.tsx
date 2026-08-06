import { notFound, redirect } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getCustomerById } from "@/features/admin/customers/server/queries";
import { CustomerForm } from "@/features/admin/customers/client/customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ storeSlug: string; customerId: string }>;
}) {
  const { storeSlug, customerId } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const customerRecord = await getCustomerById(customerId);
  if (!customerRecord || customerRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit customer</h1>
      <CustomerForm
        shopId={shop.id}
        shopSlug={shop.slug}
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
