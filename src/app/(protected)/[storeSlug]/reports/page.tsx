import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { resolveDateRange } from "@/features/admin/analytics/server/date-range";
import { DateRangeFilter } from "@/features/admin/analytics/client/date-range-filter";
import { RevenueProfitChart } from "@/features/admin/analytics/client/revenue-profit-chart";
import {
  getSalesPipeline,
  getLowStockAlerts,
  getStockTurnoverRate,
  getRevenueForecast,
  getProfitAndLoss,
  getCashFlow,
} from "@/features/admin/reports/server/queries";
import { ReportCard, StatRow } from "@/features/admin/reports/client/report-card";
import { formatPrice } from "@/shared/utils/currency";

const PIPELINE_LABEL: Record<string, string> = {
  pending: "Pending",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const sp = await searchParams;
  const range = resolveDateRange(sp);
  const money = (amount: number) => formatPrice(amount, shop.currency);

  const [pipeline, lowStock, turnover, forecast, pnl, cashFlow] = await Promise.all([
    getSalesPipeline(shop.id, range.start, range.end),
    getLowStockAlerts(shop.id),
    getStockTurnoverRate(shop.id, range.start, range.end),
    getRevenueForecast(shop.id),
    getProfitAndLoss(shop.id, range.start, range.end),
    getCashFlow(shop.id, range.start, range.end),
  ]);

  const pipelineTotal = pipeline.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-neutral">
          A summary view across sales, stock, and money in and out.
        </p>
      </div>

      <DateRangeFilter basePath={`/${storeSlug}/reports`} range={range} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard title="Sales pipeline" subtitle="Orders by payment status, this period">
          {pipeline.every((p) => p.count === 0) ? (
            <p className="text-sm text-neutral">No orders in this period.</p>
          ) : (
            <div className="space-y-2">
              {pipeline
                .filter((p) => p.count > 0)
                .map((p) => (
                  <div key={p.status}>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral">
                        {PIPELINE_LABEL[p.status] ?? p.status} ({p.count})
                      </span>
                      <span className="text-ink">{money(p.amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted/40">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{
                          width: `${pipelineTotal > 0 ? Math.round((p.amount / pipelineTotal) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ReportCard>

        <ReportCard
          title="Low stock alerts"
          subtitle={`${lowStock.length} product${lowStock.length === 1 ? "" : "s"} at or below restock level`}
        >
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral">Everything's above its restock level.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-ink">
                    <AlertTriangle className="size-3.5 text-warning" /> {p.name}
                  </span>
                  <span className="text-neutral">
                    {p.quantity} / {p.restockLevel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard
          title="Stock turnover rate"
          subtitle="COGS this period ÷ current inventory value"
        >
          <div className="text-3xl font-bold text-ink">{turnover.turnoverRate.toFixed(2)}x</div>
          <p className="mt-2 text-xs text-neutral">
            Approximate — based on current inventory value, since historical stock
            snapshots aren't tracked. Higher means stock is moving faster.
          </p>
          <StatRow label="COGS (period)" value={money(turnover.cogs)} />
          <StatRow label="Current inventory value" value={money(turnover.averageInventoryValue)} />
        </ReportCard>

        <ReportCard
          title="Revenue forecast"
          subtitle={`Trailing ${forecast.trailingDays}-day average, projected forward`}
        >
          <div className="text-3xl font-bold text-ink">{money(forecast.projectedRevenue)}</div>
          <p className="mt-1 text-xs text-neutral">
            Projected over the next {forecast.forecastDays} days at{" "}
            {money(forecast.dailyAverage)}/day — a simple trailing average, not a
            seasonality-aware forecast.
          </p>
          <div className="mt-3">
            <RevenueProfitChart data={forecast.series} currency={shop.currency} />
          </div>
        </ReportCard>

        <ReportCard title="Profit &amp; loss" subtitle="This period">
          <StatRow label="Revenue" value={money(pnl.totalRevenue)} />
          <StatRow label="Cost of goods sold" value={`-${money(pnl.cogs)}`} />
          <StatRow label="Expenses" value={`-${money(pnl.totalExpenses)}`} />
          <StatRow label="Other income" value={`+${money(pnl.totalOtherIncome)}`} />
          <StatRow
            label="Net profit"
            value={money(pnl.netProfit)}
            emphasis
            tone={pnl.netProfit >= 0 ? "success" : "danger"}
          />
        </ReportCard>

        <ReportCard title="Cash flow statement" subtitle="Cash actually collected/paid this period">
          <StatRow label="Cash from sales (paid)" value={money(cashFlow.cashFromSales)} />
          <StatRow label="Cash from other income" value={money(cashFlow.cashFromIncome)} />
          <StatRow label="Cash in" value={money(cashFlow.cashIn)} tone="success" />
          <StatRow label="Cash to purchases (received)" value={`-${money(cashFlow.cashToPurchases)}`} />
          <StatRow label="Cash to expenses" value={`-${money(cashFlow.cashToExpenses)}`} />
          <StatRow label="Cash out" value={money(cashFlow.cashOut)} tone="danger" />
          <StatRow
            label="Net cash flow"
            value={money(cashFlow.netCashFlow)}
            emphasis
            tone={cashFlow.netCashFlow >= 0 ? "success" : "danger"}
          />
        </ReportCard>
      </div>
    </div>
  );
}
