import { notFound, redirect } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { CustomerForm } from "@/features/admin/customers/client/customer-form";

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add customer</h1>
      <CustomerForm shopId={shop.id} shopSlug={shop.slug} />
    </div>
  );
}
