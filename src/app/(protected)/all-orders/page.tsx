import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Package } from "lucide-react";

import { listOrdersForBuyer } from "@/features/admin/sales/server/queries";
import { getReviewsByBuyerForProducts } from "@/features/admin/reviews/server/queries";
import { formatPrice } from "@/shared/utils/currency";
import { OrderItemReviewButton } from "@/features/admin/reviews/client/order-item-review-button";
import { GlobalNav } from "@/shared/components/app/global-nav";

export const dynamic = "force-dynamic";

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export default async function AllOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const orders = await listOrdersForBuyer(userId);

  const productIds = Array.from(
    new Set(orders.flatMap((o) => o.items.map((i) => i.productId).filter((id): id is string => !!id))),
  );
  const reviewsByProduct = await getReviewsByBuyerForProducts(userId, productIds);

  return (
    <div>
      <GlobalNav />
      <div className="mx-auto max-w-3xl p-4 md:px-12 py-10">
        <h1 className="text-2xl font-bold text-ink">Your orders</h1>
        <p className="mt-1 text-sm text-neutral">
          Orders you&apos;ve placed across every store, most recent first.{" "}
        </p>

        {orders.length === 0 ? (
          <div className="py-16 text-center text-neutral">
            <Package className="mx-auto mb-3 size-10" />
            <p className="text-lg font-medium text-ink">No orders yet</p>
            <p className="mt-1 text-sm">
              Orders you place while signed in will show up here.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-muted/40 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-muted/40 pb-3">
                  <div>
                    <p className="font-medium text-ink">
                      {order.shop ? (
                        <Link
                          href={`/stores/${order.shop.slug}`}
                          className="hover:underline"
                        >
                          {order.shop.name}
                        </Link>
                      ) : (
                        "Unknown store"
                      )}
                    </p>
                    <p className="text-xs text-neutral">
                      Order {order.saleNumber} &middot;{" "}
                      {order.saleDate.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">
                      {formatPrice(
                        order.totalAmount,
                        order.shop?.currency ?? "USD",
                      )}
                    </p>
                    <p className="text-xs text-neutral">
                      {PAYMENT_STATUS_LABEL[order.paymentStatus] ??
                        order.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {order.items.map((item) => {
                    const existingReview = item.productId
                      ? reviewsByProduct.get(item.productId)
                      : undefined;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-ink">
                          {item.productName} × {item.quantity}
                        </span>
                        {item.productId &&
                          order.shop &&
                          order.paymentStatus !== "cancelled" && (
                            <OrderItemReviewButton
                              shopId={order.shop.id}
                              productId={item.productId}
                              productName={item.productName}
                              existingReview={
                                existingReview
                                  ? {
                                      rating: existingReview.rating,
                                      title: existingReview.title,
                                      body: existingReview.body,
                                    }
                                  : null
                              }
                            />
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
