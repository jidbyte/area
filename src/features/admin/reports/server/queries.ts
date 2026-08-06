import { and, eq, gte, isNull, lte } from "drizzle-orm";

import { db } from "@/shared/db";
import { product, sale, purchase, expense, income } from "@/shared/db/schema";
import {
  getPaymentStatusBreakdown,
  getRangeSalesStats,
  getRevenueProfitSeries,
} from "@/features/admin/analytics/server/queries";

/** Sales pipeline — reuses the same payment-status breakdown analytics already computes. */
export async function getSalesPipeline(shopId: string, start: Date, end: Date) {
  return getPaymentStatusBreakdown(shopId, start, end);
}

/** Full low-stock list (the dashboard/analytics version caps at 5 for a summary card). */
export async function getLowStockAlerts(shopId: string) {
  const products = await db.query.product.findMany({
    where: and(eq(product.shopId, shopId), isNull(product.deletedAt), eq(product.isActive, true)),
    columns: { id: true, name: true, sku: true, quantity: true, restockLevel: true },
  });
  return products
    .filter((p) => p.quantity <= p.restockLevel)
    .sort((a, b) => a.quantity - b.quantity);
}

/**
 * Stock turnover = cost of goods sold in the period / average inventory
 * value. We don't keep historical inventory-value snapshots, so "average"
 * here is approximated as current inventory value — a real limitation
 * worth surfacing in the UI rather than presenting this as more precise
 * than it is. Higher = stock is moving faster.
 */
export async function getStockTurnoverRate(shopId: string, start: Date, end: Date) {
  const series = await getRevenueProfitSeries(shopId, start, end, "day");
  const cogs = series.reduce((sum, b) => sum + (b.revenue - b.profit), 0);

  const products = await db.query.product.findMany({
    where: and(eq(product.shopId, shopId), isNull(product.deletedAt)),
    columns: { quantity: true, costPrice: true },
  });
  const currentInventoryValue = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);

  const turnoverRate = currentInventoryValue > 0 ? cogs / currentInventoryValue : 0;

  return { cogs, averageInventoryValue: currentInventoryValue, turnoverRate };
}

/**
 * Simple trailing-average projection — takes the last `trailingDays` of
 * daily revenue and extrapolates flat over the next `forecastDays`. This is
 * deliberately simple (no seasonality, no trend line) — good enough to
 * flag "at this pace, expect roughly X" without pretending to be a real
 * forecasting model.
 */
export async function getRevenueForecast(
  shopId: string,
  trailingDays = 30,
  forecastDays = 30,
) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - trailingDays);

  const series = await getRevenueProfitSeries(shopId, start, end, "day");
  const totalTrailingRevenue = series.reduce((sum, b) => sum + b.revenue, 0);
  const dailyAverage = series.length > 0 ? totalTrailingRevenue / series.length : 0;

  return {
    trailingDays,
    forecastDays,
    dailyAverage,
    projectedRevenue: dailyAverage * forecastDays,
    series,
  };
}

/** Profit & loss for the period: revenue - COGS - expenses + other income. */
export async function getProfitAndLoss(shopId: string, start: Date, end: Date) {
  const { totalRevenue } = await getRangeSalesStats(shopId, start, end);
  const series = await getRevenueProfitSeries(shopId, start, end, "day");
  const cogs = series.reduce((sum, b) => sum + (b.revenue - b.profit), 0);

  const expenseRows = await db.query.expense.findMany({
    where: and(
      eq(expense.shopId, shopId),
      isNull(expense.deletedAt),
      gte(expense.expenseDate, start),
      lte(expense.expenseDate, end),
    ),
    columns: { amount: true },
  });
  const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

  const incomeRows = await db.query.income.findMany({
    where: and(
      eq(income.shopId, shopId),
      isNull(income.deletedAt),
      gte(income.incomeDate, start),
      lte(income.incomeDate, end),
    ),
    columns: { amount: true },
  });
  const totalOtherIncome = incomeRows.reduce((sum, i) => sum + i.amount, 0);

  const netProfit = totalRevenue - cogs - totalExpenses + totalOtherIncome;

  return { totalRevenue, cogs, totalExpenses, totalOtherIncome, netProfit };
}

/** Cash flow for the period: cash actually collected/paid, not accrued revenue/spend. */
export async function getCashFlow(shopId: string, start: Date, end: Date) {
  const paidSales = await db.query.sale.findMany({
    where: and(
      eq(sale.shopId, shopId),
      eq(sale.paymentStatus, "paid"),
      gte(sale.saleDate, start),
      lte(sale.saleDate, end),
    ),
    columns: { totalAmount: true },
  });
  const cashFromSales = paidSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const incomeRows = await db.query.income.findMany({
    where: and(
      eq(income.shopId, shopId),
      isNull(income.deletedAt),
      gte(income.incomeDate, start),
      lte(income.incomeDate, end),
    ),
    columns: { amount: true },
  });
  const cashFromIncome = incomeRows.reduce((sum, i) => sum + i.amount, 0);

  const receivedPurchases = await db.query.purchase.findMany({
    where: and(
      eq(purchase.shopId, shopId),
      eq(purchase.purchaseStatus, "received"),
      gte(purchase.purchaseDate, start),
      lte(purchase.purchaseDate, end),
    ),
    columns: { totalAmount: true },
  });
  const cashToPurchases = receivedPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const expenseRows = await db.query.expense.findMany({
    where: and(
      eq(expense.shopId, shopId),
      isNull(expense.deletedAt),
      gte(expense.expenseDate, start),
      lte(expense.expenseDate, end),
    ),
    columns: { amount: true },
  });
  const cashToExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

  const cashIn = cashFromSales + cashFromIncome;
  const cashOut = cashToPurchases + cashToExpenses;

  return {
    cashFromSales,
    cashFromIncome,
    cashIn,
    cashToPurchases,
    cashToExpenses,
    cashOut,
    netCashFlow: cashIn - cashOut,
  };
}
