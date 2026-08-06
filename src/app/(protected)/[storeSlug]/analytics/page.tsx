import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getCurrencySymbol } from "@/shared/config/currencies";
import { resolveDateRange } from "@/features/admin/analytics/server/date-range";
import {
  getRevenueProfitSeries,
  getTopProductsBySales,
  getTopCustomersBySales,
  getPaymentStatusBreakdown,
  getPurchaseStatusBreakdown,
} from "@/features/admin/analytics/server/queries";
import { RevenueProfitChart } from "@/features/admin/analytics/client/revenue-profit-chart";
import { TopProductsChart } from "@/features/admin/analytics/client/top-products-chart";
import { DateRangeFilter } from "@/features/admin/analytics/client/date-range-filter";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const range = resolveDateRange(await searchParams);

  const [
    series,
    topProducts,
    topCustomers,
    paymentBreakdown,
    purchaseBreakdown,
  ] = await Promise.all([
    getRevenueProfitSeries(shop.id, range.start, range.end, range.granularity),
    getTopProductsBySales(shop.id, range.start, range.end),
    getTopCustomersBySales(shop.id, range.start, range.end),
    getPaymentStatusBreakdown(shop.id, range.start, range.end),
    getPurchaseStatusBreakdown(shop.id),
  ]);

  const currencySymbol = getCurrencySymbol(shop.currency);
  const totalRevenue = series.reduce((sum, p) => sum + p.revenue, 0);
  const totalProfit = series.reduce((sum, p) => sum + p.profit, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <DateRangeFilter basePath={`/${storeSlug}/analytics`} range={range} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs. profit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Revenue</p>
              <p className="font-semibold">
                {currencySymbol}
                {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Profit (est.)</p>
              <p className="font-semibold">
                {currencySymbol}
                {totalProfit.toLocaleString()}
              </p>
            </div>
          </div>
          <RevenueProfitChart data={series} currency={currencySymbol} />
          <p className="text-muted-foreground text-xs">
            Profit is estimated from each product&apos;s current cost, not
            necessarily what it cost at the time of that sale.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products by revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No sales in this range yet.
              </p>
            ) : (
              <TopProductsChart data={topProducts} currency={currencySymbol} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top customers by revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No sales in this range yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topCustomers.map((c, i) => (
                  <li
                    key={c.customerName}
                    className="flex items-center justify-between"
                  >
                    <span>
                      <span className="text-muted-foreground mr-2">
                        {i + 1}.
                      </span>
                      {c.customerName}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {c.revenue.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by payment status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {paymentBreakdown
                .filter((row) => row.count > 0)
                .map((row) => (
                  <li
                    key={row.status}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{row.status}</span>
                    <span>
                      {row.count} · {currencySymbol}
                      {row.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              {paymentBreakdown.every((row) => row.count === 0) && (
                <p className="text-muted-foreground text-sm">
                  No sales in this range yet.
                </p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Purchase orders by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {purchaseBreakdown
                .filter((row) => row.count > 0)
                .map((row) => (
                  <li
                    key={row.status}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{row.status}</span>
                    <span>
                      {row.count} · {currencySymbol}
                      {row.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              {purchaseBreakdown.every((row) => row.count === 0) && (
                <p className="text-muted-foreground text-sm">
                  No purchase orders yet.
                </p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
