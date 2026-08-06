import { notFound, redirect } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { SupplierForm } from "@/features/admin/suppliers/client/supplier-form";

export default async function NewSupplierPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add supplier</h1>
      <SupplierForm shopId={shop.id} shopSlug={shop.slug} />
    </div>
  );
}
