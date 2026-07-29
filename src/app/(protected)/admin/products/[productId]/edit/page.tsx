import { notFound, redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getProductById } from "@/features/inventory/server/queries";
import { ProductForm } from "@/features/inventory/client/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const productRecord = await getProductById(productId);
  if (!productRecord || productRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit product</h1>
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
          price: productRecord.price,
          cost: productRecord.cost,
          quantity: productRecord.quantity,
          restockLevel: productRecord.restockLevel,
          optimalLevel: productRecord.optimalLevel,
          categories: productRecord.productCategories.map((pc) => pc.category.name),
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
