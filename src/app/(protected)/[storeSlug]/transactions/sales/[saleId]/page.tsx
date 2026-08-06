import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getSaleById } from "@/features/admin/sales/server/queries";
import { SalePaymentActions } from "@/features/admin/sales/client/sale-payment-actions";
import type { PaymentStatus } from "@/features/admin/sales/server/schema";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; saleId: string }>;
}) {
  const { storeSlug, saleId } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const saleRecord = await getSaleById(saleId);
  if (!saleRecord || saleRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{saleRecord.saleNumber}</h1>
          <p className="text-muted-foreground text-sm">
            {saleRecord.customerName} ·{" "}
            {new Date(saleRecord.saleDate).toLocaleDateString()}
          </p>
        </div>
        {saleRecord.paymentStatus !== "cancelled" && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/${storeSlug}/transactions/sales/${saleRecord.id}/edit`}>Edit</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <SalePaymentActions
            saleId={saleRecord.id}
            paymentStatus={saleRecord.paymentStatus as PaymentStatus}
            balance={saleRecord.balance}
          />
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Item</th>
              <th className="px-3 py-2 text-left font-medium">SKU</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Unit price</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {saleRecord.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.productName}</td>
                <td className="px-3 py-2">{item.productSku}</td>
                <td className="px-3 py-2 text-right">{item.quantity}</td>
                <td className="px-3 py-2 text-right">
                  {shop.currency} {item.unitPrice.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {shop.currency} {item.subtotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto max-w-sm space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discount</span>
          <span>
            -{shop.currency} {saleRecord.discountAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span>
            {shop.currency} {saleRecord.totalAmount.toLocaleString()}
          </span>
        </div>
        {saleRecord.balance > 0 && (
          <div className="text-amber-600 flex justify-between">
            <span>Balance owed</span>
            <span>
              {shop.currency} {saleRecord.balance.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
