import { notFound, redirect } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getProductById } from "@/features/admin/products/server/queries";
import { ProductForm } from "@/features/admin/products/client/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { storeSlug, productId } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const productRecord = await getProductById(productId);
  if (!productRecord || productRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-4">
      <ProductForm
        shopId={shop.id}
        shopSlug={shop.slug}
        currency={shop.currency}
        productId={productRecord.id}
        defaultValues={{
          name: productRecord.name,
          sku: productRecord.sku,
          brand: productRecord.brand ?? "",
          model: productRecord.model ?? "",
          description: productRecord.description ?? "",
          sellingPrice: productRecord.sellingPrice,
          costPrice: productRecord.costPrice,
          quantity: productRecord.quantity,
          restockLevel: productRecord.restockLevel,
          categories: productRecord.productCategories.map(
            (pc) => pc.category.name,
          ),
          images: productRecord.images.map((img) => ({
            url: img.url,
            fileKey: img.fileKey,
            isPrimary: img.isPrimary,
          })),
        }}
      />
    </div>
  );
}
