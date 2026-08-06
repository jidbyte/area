import { notFound, redirect } from "next/navigation";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { ProductForm } from "@/features/admin/products/client/product-form";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-6">
      <ProductForm
        shopId={shop.id}
        shopSlug={shop.slug}
        currency={shop.currency}
      />
    </div>
  );
}
