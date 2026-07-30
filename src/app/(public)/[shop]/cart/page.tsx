import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/shops/server/queries";
import { resolveBuyerIdentity } from "@/features/cart/server/identity";
import { getCartWithItems } from "@/features/cart/server/queries";
import { ShopHeader } from "@/features/shops/client/shop-header";
import { CartView, type CartLineItem } from "@/features/cart/client/cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const identity = await resolveBuyerIdentity();
  const cartRecord = await getCartWithItems(shop.id, identity);

  const items: CartLineItem[] = (cartRecord?.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    maxQuantity: item.product.quantity,
    imageUrl:
      item.product.images.find((i) => i.isPrimary)?.url ??
      item.product.images[0]?.url ??
      null,
  }));

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
        <CartView shopSlug={slug} currency={shop.currency} items={items} />
      </div>
    </div>
  );
}
