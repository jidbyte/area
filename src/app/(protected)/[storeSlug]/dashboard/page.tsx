import { notFound } from "next/navigation";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getCurrencySymbol } from "@/shared/config/currencies";
import { listSalesByShop } from "@/features/admin/sales/server/queries";
import { resolveDateRange } from "@/features/admin/analytics/server/date-range";
import {
  getRangeSalesStats,
  getRangePurchasesStats,
  getRevenueProfitSeries,
  getCurrentPurchasesStats,
  getInventoryOverviewForShop,
  getTopProductsBySales,
} from "@/features/admin/analytics/server/queries";
import { RevenueProfitChartCard } from "@/features/admin/analytics/client/revenue-profit-chart";
import { DateRangeFilter } from "@/features/admin/analytics/client/date-range-filter";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import {
  LowStockCard,
  RecentSalesCard,
  BestSellingProductsCard,
} from "@/features/admin/analytics/client/dashboard-cards";
import { DashboardStats } from "@/features/admin/analytics/client/dashboard-stats";
import {
  PageAction,
  PageHeader,
  PageTitle,
} from "@/shared/components/common/page-header";
import { cn } from "@/shared/lib/utils";

const MIN_SALES_FOR_INSIGHTS = 5;

export default async function AdminDashboardPage({
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
    rangeSales,
    rangePurchases,
    series,
    currentPurchases,
    inventoryOverview,
    sales,
    topProducts,
  ] = await Promise.all([
    getRangeSalesStats(shop.id, range.start, range.end),
    getRangePurchasesStats(shop.id, range.start, range.end),
    getRevenueProfitSeries(shop.id, range.start, range.end, range.granularity),
    getCurrentPurchasesStats(shop.id),
    getInventoryOverviewForShop(shop.id),
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
          <DateRangeFilter basePath={`/${storeSlug}/dashboard`} range={range} />
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
              shopSlug={storeSlug}
            />

            <LowStockCard products={inventoryOverview.lowStockProducts} />
          </>
        )}
      </div>
    </div>
  );
}
