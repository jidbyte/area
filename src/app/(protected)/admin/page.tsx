import { redirect } from "next/navigation";
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
  getTopProductsBySales,
} from "@/features/analytics/server/queries";
import { listCustomersByShop } from "@/features/customers/server/queries";
import { listSuppliersByShop } from "@/features/suppliers/server/queries";
import { RevenueProfitChartCard } from "@/features/analytics/client/revenue-profit-chart";
import { DateRangeFilter } from "@/features/analytics/client/date-range-filter";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import {
  LowStockCard,
  RecentSalesCard,
  BestSellingProductsCard,
} from "@/features/analytics/client/dashboard-cards";
import { DashboardStats } from "@/features/analytics/client/dashboard-stats";
import {
  PageAction,
  PageHeader,
  PageTitle,
} from "@/shared/components/pages/page-header";
import { cn } from "@/shared/lib/utils";

const MIN_SALES_FOR_INSIGHTS = 5;

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
    topProducts,
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
    getTopProductsBySales(shop.id, range.start, range.end, 5),
  ]);

  const currencySymbol = getCurrencySymbol(shop.currency);
  const recentSales = sales.slice(0, 5);
  const hasEnoughSalesForInsights = sales.length >= MIN_SALES_FOR_INSIGHTS;

  // Net profit for the selected range = sum of per-bucket (revenue - cogs)
  // from the same series already fetched for the chart, so no extra query.
  const netProfit = series.reduce((sum, d) => sum + d.profit, 0);

  return (
    <div className="space-y-6 mt-6">
      <PageHeader>
        <PageTitle icon={TbLayoutDashboardFilled}>Overview</PageTitle>
        <PageAction>
          <DateRangeFilter basePath="/admin" range={range} />
        </PageAction>
      </PageHeader>

      <DashboardStats
        currencySymbol={currencySymbol}
        totalSalesRevenue={rangeSales.totalRevenue}
        netProfit={netProfit}
        totalSalesCount={rangeSales.totalSalesCount}
        inventorySpend={rangePurchases.totalSpent}
        pendingPurchaseOrders={currentPurchases.pendingCount}
        totalInventoryValue={inventoryOverview.totalInventoryValue}
        totalStockQuantity={inventoryOverview.totalStockQuantity}
      />

      <RevenueProfitChartCard data={series} currency={currencySymbol} />

      <div
        className={cn(
          "grid gap-4 lg:gap-8 my-10",
          hasEnoughSalesForInsights ? "lg:grid-cols-3" : "lg:grid-cols-1",
        )}
      >
        {hasEnoughSalesForInsights && (
          <>
            <BestSellingProductsCard
              products={topProducts}
              currencySymbol={currencySymbol}
            />

            <RecentSalesCard
              sales={recentSales}
              currencySymbol={currencySymbol}
            />

            <LowStockCard products={inventoryOverview.lowStockProducts} />
          </>
        )}
      </div>
    </div>
  );
}
