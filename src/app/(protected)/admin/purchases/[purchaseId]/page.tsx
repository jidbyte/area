import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getPurchaseById } from "@/features/purchases/server/queries";
import { PurchaseStatusActions } from "@/features/purchases/client/purchase-status-actions";
import type {
  PurchaseStatus,
  PaymentStatus,
} from "@/features/purchases/server/schema";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const purchaseRecord = await getPurchaseById(purchaseId);
  if (!purchaseRecord || purchaseRecord.shopId !== shop.id) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {purchaseRecord.purchaseNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            {purchaseRecord.supplierName} ·{" "}
            {new Date(purchaseRecord.purchaseDate).toLocaleDateString()}
          </p>
        </div>
        {purchaseRecord.purchaseStatus === "draft" && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/purchases/${purchaseRecord.id}/edit`}>
              Edit
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <PurchaseStatusActions
            purchaseId={purchaseRecord.id}
            purchaseStatus={purchaseRecord.purchaseStatus as PurchaseStatus}
            paymentStatus={purchaseRecord.paymentStatus as PaymentStatus}
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
              <th className="px-3 py-2 text-right font-medium">Unit cost</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRecord.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.productName}</td>
                <td className="px-3 py-2">{item.productSku}</td>
                <td className="px-3 py-2 text-right">{item.quantity}</td>
                <td className="px-3 py-2 text-right">
                  {shop.currency} {item.unitCost.toLocaleString()}
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
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shop.currency} {purchaseRecord.shippingCost.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discount</span>
          <span>
            -{shop.currency} {purchaseRecord.discountAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span>
            {shop.currency} {purchaseRecord.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
