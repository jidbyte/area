import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getCurrencySymbol } from "@/shared/config/currencies";
import { listSalesByShop } from "@/features/sales/server/queries";
import { resolveDateRange } from "@/features/analytics/server/date-range";
import {
  getRangeSalesStats,
  getRangePurchasesStats,
  getRevenueProfitSeries,
  getCurrentSalesStats,
  getCurrentPurchasesStats,
  getInventoryOverviewForShop,
} from "@/features/analytics/server/queries";
import { listCustomersByShop } from "@/features/customers/server/queries";
import { listSuppliersByShop } from "@/features/suppliers/server/queries";
import { RevenueProfitChart } from "@/features/analytics/client/revenue-profit-chart";
import { DateRangeFilter } from "@/features/analytics/client/date-range-filter";
import { StatCard } from "@/features/analytics/client/stat-card";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const range = resolveDateRange(await searchParams);

  const [
    rangeSales,
    rangePurchases,
    series,
    currentSales,
    currentPurchases,
    inventoryOverview,
    customers,
    suppliers,
    sales,
  ] = await Promise.all([
    getRangeSalesStats(shop.id, range.start, range.end),
    getRangePurchasesStats(shop.id, range.start, range.end),
    getRevenueProfitSeries(shop.id, range.start, range.end, range.granularity),
    getCurrentSalesStats(shop.id),
    getCurrentPurchasesStats(shop.id),
    getInventoryOverviewForShop(shop.id),
    listCustomersByShop(shop.id),
    listSuppliersByShop(shop.id),
    listSalesByShop(shop.id),
  ]);

  const currencySymbol = getCurrencySymbol(shop.currency);
  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Buyers can find you at{" "}
            <span className="font-medium">/{shop.slug}</span>
          </p>
        </div>
        <DateRangeFilter basePath="/admin" range={range} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={`${currencySymbol}${rangeSales.totalRevenue.toLocaleString()}`}
        />
        <StatCard
          label="Sale transactions"
          value={String(rangeSales.totalSalesCount)}
        />
        <StatCard
          label="Outstanding balance"
          value={`${currencySymbol}${currentSales.outstandingBalance.toLocaleString()}`}
        />
        <StatCard
          label="Inventory spend"
          value={`${currencySymbol}${rangePurchases.totalSpent.toLocaleString()}`}
          hint={
            currentPurchases.pendingCount > 0
              ? `${currentPurchases.pendingCount} pending order${currentPurchases.pendingCount === 1 ? "" : "s"}`
              : undefined
          }
        />
        <StatCard
          label="Total inventory value"
          value={`${currencySymbol}${inventoryOverview.totalInventoryValue.toLocaleString()}`}
        />
        <StatCard
          label="Products"
          value={String(inventoryOverview.totalProducts)}
          hint={
            inventoryOverview.lowStockCount > 0
              ? `${inventoryOverview.lowStockCount} low stock`
              : undefined
          }
        />
        <StatCard label="Customers" value={String(customers.length)} />
        <StatCard label="Suppliers" value={String(suppliers.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue &amp; profit</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueProfitChart data={series} currency={currencySymbol} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {inventoryOverview.lowStockProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Low stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1 text-sm">
                {inventoryOverview.lowStockProducts.map((p) => (
                  <li key={p.name} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-destructive">{p.quantity} left</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/products"
                className="text-primary text-xs hover:underline"
              >
                View all products
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent sales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No sales recorded yet.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {recentSales.map((s) => (
                  <li key={s.id} className="flex justify-between">
                    <Link
                      href={`/admin/sales/${s.id}`}
                      className="hover:underline"
                    >
                      {s.saleNumber} — {s.customerName}
                    </Link>
                    <span>
                      {currencySymbol}
                      {s.totalAmount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/sales"
              className="text-primary text-xs hover:underline"
            >
              View all sales
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
