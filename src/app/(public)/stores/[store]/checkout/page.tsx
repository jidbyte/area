import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { resolveBuyerIdentity } from "@/features/app/payments/server/identity";
import { getCartWithItems } from "@/features/app/payments/server/cart-queries";
import { ShopHeader } from "@/features/app/stores/client/shop-header";
import { GuestCartCheckoutSync } from "@/features/app/payments/client/guest-cart-checkout-sync";
import {
  CheckoutLineItem,
  CheckoutForm,
} from "@/features/app/payments/client/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const identity = await resolveBuyerIdentity();
  const cartRecord = await getCartWithItems(shop.id, identity);

  // An empty DB cart here doesn't necessarily mean an empty cart — a guest's
  // items live in zustand until this point. Hand off to a client component
  // that syncs zustand -> DB (or redirects to /cart if genuinely empty)
  // instead of redirecting unconditionally.
  if (!cartRecord || cartRecord.items.length === 0) {
    return (
      <div>
        <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />
        <div className="mx-auto max-w-3xl p-8">
          <GuestCartCheckoutSync shopId={shop.id} shopSlug={slug} />
        </div>
      </div>
    );
  }

  const items: CheckoutLineItem[] = cartRecord.items.map((item) => ({
    id: item.id,
    name: item.product.name,
    sellingPrice: item.product.sellingPrice,
    quantity: item.quantity,
  }));
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0,
  );

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />

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
