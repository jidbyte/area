import { notFound } from "next/navigation";
import Link from "next/link";
import { Show } from "@clerk/nextjs";

import { getShopBySlug } from "@/features/shops/server/queries";
import { getSaleById } from "@/features/sales/server/queries";
import { ShopHeader } from "@/features/shops/client/shop-header";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ shop: string; saleId: string }>;
}) {
  const { shop: slug, saleId } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const saleRecord = await getSaleById(saleId);
  if (!saleRecord || saleRecord.shopId !== shop.id) notFound();

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />

      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold">Thank you!</h1>
          <p className="text-muted-foreground text-sm">
            Order {saleRecord.saleNumber} has been placed.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {saleRecord.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.productName}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {shop.currency} {item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>
            {shop.currency} {saleRecord.totalAmount.toLocaleString()}
          </span>
        </div>

        <p className="text-muted-foreground text-sm">
          We&apos;ll be in touch about payment and delivery using the contact
          details you provided.
        </p>

        <Show when="signed-out">
          <p className="text-muted-foreground text-sm">
            <Link
              href={`/sign-up?redirect_url=/${slug}`}
              className="text-primary hover:underline"
            >
              Create an account
            </Link>{" "}
            to track this order and any future ones.
          </p>
        </Show>

        <Link
          href={`/${slug}`}
          className="text-primary text-sm hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
