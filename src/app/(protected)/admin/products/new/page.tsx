import { redirect } from "next/navigation";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { ProductForm } from "@/features/inventory/client/product-form";

export default async function NewProductPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add product</h1>
      <ProductForm shopId={shop.id} shopSlug={shop.slug} currency={shop.currency} />
    </div>
  );
}
