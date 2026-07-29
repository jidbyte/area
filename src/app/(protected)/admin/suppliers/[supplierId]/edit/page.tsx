import { notFound, redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getSupplierById } from "@/features/suppliers/server/queries";
import { SupplierForm } from "@/features/suppliers/client/supplier-form";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = await params;
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const supplierRecord = await getSupplierById(supplierId);
  if (!supplierRecord || supplierRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit supplier</h1>
      <SupplierForm
        shopId={shop.id}
        supplierId={supplierRecord.id}
        defaultValues={{
          companyName: supplierRecord.companyName,
          contactName: supplierRecord.contactName ?? "",
          phone: supplierRecord.phone ?? "",
          email: supplierRecord.email ?? "",
          website: supplierRecord.website ?? "",
          address: supplierRecord.address ?? "",
        }}
      />
    </div>
  );
}
