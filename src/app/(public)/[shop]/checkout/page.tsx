import { notFound, redirect } from "next/navigation";

import { getShopBySlug } from "@/features/shops/server/queries";
import { resolveBuyerIdentity } from "@/features/cart/server/identity";
import { getCartWithItems } from "@/features/cart/server/queries";
import { ShopHeader } from "@/features/shops/client/shop-header";
import {
  CheckoutLineItem,
  CheckoutForm,
} from "@/features/checkout/client/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const identity = await resolveBuyerIdentity();
  const cartRecord = await getCartWithItems(shop.id, identity);
  if (!cartRecord || cartRecord.items.length === 0) redirect(`/${slug}/cart`);

  const items: CheckoutLineItem[] = cartRecord.items.map((item) => ({
    id: item.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />
      {/* <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
        {!shop.paystackSubaccountCode ? (
          <p className="text-muted-foreground text-sm">
            This shop hasn&apos;t finished setting up payments yet — check back
            soon.
          </p>
        ) : (
          <CheckoutForm
            shopId={shop.id}
            currency={shop.currency}
            items={items}
            subtotal={subtotal}
          />
        )}
      </div> */}

      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
        <CheckoutForm
          shopId={shop.id}
          shopSlug={slug}
          currency={shop.currency}
          items={items}
          subtotal={subtotal}
          canPayOnline={!!shop.paystackSubaccountCode}
        />
      </div>
    </div>
  );
}
