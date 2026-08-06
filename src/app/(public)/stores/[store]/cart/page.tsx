import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { resolveBuyerIdentity } from "@/features/app/payments/server/identity";
import { getCartWithItems } from "@/features/app/payments/server/cart-queries";
import { ShopHeader } from "@/features/app/stores/client/shop-header";
import { CartView, type CartLineItem } from "@/features/app/payments/client/cart-view";
import { GuestCartView } from "@/features/app/payments/client/guest-cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const { userId } = await auth();

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
        {userId ? (
          <SignedInCart shopId={shop.id} shopSlug={slug} currency={shop.currency} />
        ) : (
          <GuestCartView shopId={shop.id} shopSlug={slug} currency={shop.currency} />
        )}
      </div>
    </div>
  );
}

// Split out so the guest path above never touches the DB at all — the
// identity/cart lookups here only run once we know there's a signed-in
// buyer.
async function SignedInCart({
  shopId,
  shopSlug,
  currency,
}: {
  shopId: string;
  shopSlug: string;
  currency: string;
}) {
  const identity = await resolveBuyerIdentity();
  const cartRecord = await getCartWithItems(shopId, identity);

  const items: CartLineItem[] = (cartRecord?.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    sellingPrice: item.product.sellingPrice,
    quantity: item.quantity,
    maxQuantity: item.product.quantity,
    imageUrl:
      item.product.images.find((i) => i.isPrimary)?.url ??
      item.product.images[0]?.url ??
      null,
  }));

  return <CartView shopSlug={shopSlug} currency={currency} items={items} />;
}
