import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getSupplierById } from "@/features/admin/suppliers/server/queries";
import { SupplierForm } from "@/features/admin/suppliers/client/supplier-form";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ storeSlug: string; supplierId: string }>;
}) {
  const { storeSlug, supplierId } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const supplierRecord = await getSupplierById(supplierId);
  if (!supplierRecord || supplierRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit supplier</h1>
      <SupplierForm
        shopId={shop.id}
        shopSlug={shop.slug}
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
