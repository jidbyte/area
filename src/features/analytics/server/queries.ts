import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";

import { db } from "@/shared/db";
import { sale, saleItem, purchase, product } from "@/shared/db/schema";

type Granularity = "hour" | "day" | "month";

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "hour") return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  if (granularity === "day") return date.toISOString().slice(0, 10); // YYYY-MM-DD
  return date.toISOString().slice(0, 7); // YYYY-MM
}

function buildEmptyBuckets(
  start: Date,
  end: Date,
  granularity: Granularity,
): Map<string, { revenue: number; profit: number }> {
  const buckets = new Map<string, { revenue: number; profit: number }>();
  const cursor = new Date(start);
  if (granularity === "hour") cursor.setMinutes(0, 0, 0);
  if (granularity === "day") cursor.setHours(0, 0, 0, 0);
  if (granularity === "month") cursor.setDate(1);

  while (cursor <= end) {
    buckets.set(bucketKey(cursor, granularity), { revenue: 0, profit: 0 });
    if (granularity === "hour") cursor.setHours(cursor.getHours() + 1);
    else if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

// --- Range-filtered (respects the D/W/M/Y/MAX/custom filter) ---

export async function getRangeSalesStats(
  shopId: string,
  start: Date,
  end: Date,
) {
  const sales = await db.query.sale.findMany({
    where: and(
      eq(sale.shopId, shopId),
      gte(sale.saleDate, start),
      lte(sale.saleDate, end),
    ),
    columns: { totalAmount: true, paymentStatus: true },
  });
  const active = sales.filter((s) => s.paymentStatus !== "cancelled");

  return {
    totalRevenue: active.reduce((sum, s) => sum + s.totalAmount, 0),
    totalSalesCount: active.length,
  };
}

// Filtered by order date (purchase.purchaseDate), not delivery date — "spend
// in this period" reads as "orders placed in this period that have since
// been received," which is simple and matches the field we already index on.
export async function getRangePurchasesStats(
  shopId: string,
  start: Date,
  end: Date,
) {
  const purchases = await db.query.purchase.findMany({
    where: and(
      eq(purchase.shopId, shopId),
      gte(purchase.purchaseDate, start),
      lte(purchase.purchaseDate, end),
    ),
    columns: { totalAmount: true, purchaseStatus: true },
  });

  return {
    totalSpent: purchases
      .filter((p) => p.purchaseStatus === "received")
      .reduce((sum, p) => sum + p.totalAmount, 0),
  };
}

// Revenue matches sale.totalAmount (the sale-level, discount-adjusted
// figure). Profit is estimated using each sold item's CURRENT product cost —
// sale_item doesn't snapshot cost at time of sale the way purchase_item does
// for purchases, so this is a reasonable trend estimate, not a precise
// historical figure if a product's cost has changed since it was sold.
export async function getRevenueProfitSeries(
  shopId: string,
  start: Date,
  end: Date,
  granularity: Granularity,
) {
  const sales = await db.query.sale.findMany({
    where: and(
      eq(sale.shopId, shopId),
      gte(sale.saleDate, start),
      lte(sale.saleDate, end),
    ),
    columns: {
      id: true,
      totalAmount: true,
      paymentStatus: true,
      saleDate: true,
    },
  });
  const activeSaleIds = sales
    .filter((s) => s.paymentStatus !== "cancelled")
    .map((s) => s.id);

  const items = activeSaleIds.length
    ? await db
        .select({
          saleId: saleItem.saleId,
          productId: saleItem.productId,
          quantity: saleItem.quantity,
        })
        .from(saleItem)
        .where(inArray(saleItem.saleId, activeSaleIds))
    : [];

  const productIds = Array.from(
    new Set(items.map((i) => i.productId).filter((id): id is string => !!id)),
  );
  const products = productIds.length
    ? await db.query.product.findMany({
        where: inArray(product.id, productIds),
        columns: { id: true, cost: true },
      })
    : [];
  const costById = new Map(products.map((p) => [p.id, p.cost]));

  const cogsBySaleId = new Map<string, number>();
  for (const item of items) {
    const cost = item.productId ? (costById.get(item.productId) ?? 0) : 0;
    cogsBySaleId.set(
      item.saleId,
      (cogsBySaleId.get(item.saleId) ?? 0) + cost * item.quantity,
    );
  }

  const buckets = buildEmptyBuckets(start, end, granularity);

  for (const s of sales) {
    if (s.paymentStatus === "cancelled") continue;
    const key = bucketKey(s.saleDate, granularity);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const cogs = cogsBySaleId.get(s.id) ?? 0;
    bucket.revenue += s.totalAmount;
    bucket.profit += s.totalAmount - cogs;
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
}

export async function getTopProductsBySales(
  shopId: string,
  start: Date,
  end: Date,
  limit = 5,
) {
  const rows = await db
    .select({
      productName: saleItem.productName,
      quantity: saleItem.quantity,
      subtotal: saleItem.subtotal,
      paymentStatus: sale.paymentStatus,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .where(
      and(
        eq(sale.shopId, shopId),
        gte(sale.saleDate, start),
        lte(sale.saleDate, end),
      ),
    );

  const byProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const row of rows) {
    if (row.paymentStatus === "cancelled") continue;
    const entry = byProduct.get(row.productName) ?? { quantity: 0, revenue: 0 };
    entry.quantity += row.quantity;
    entry.revenue += row.subtotal;
    byProduct.set(row.productName, entry);
  }

  return Array.from(byProduct.entries())
    .map(([productName, stats]) => ({ productName, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getTopCustomersBySales(
  shopId: string,
  start: Date,
  end: Date,
  limit = 5,
) {
  const rows = await db.query.sale.findMany({
    where: and(
      eq(sale.shopId, shopId),
      gte(sale.saleDate, start),
      lte(sale.saleDate, end),
    ),
    columns: { customerName: true, totalAmount: true, paymentStatus: true },
  });

  const byCustomer = new Map<string, number>();
  for (const row of rows) {
    if (row.paymentStatus === "cancelled") continue;
    byCustomer.set(
      row.customerName,
      (byCustomer.get(row.customerName) ?? 0) + row.totalAmount,
    );
  }

  return Array.from(byCustomer.entries())
    .map(([customerName, revenue]) => ({ customerName, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getPaymentStatusBreakdown(
  shopId: string,
  start: Date,
  end: Date,
) {
  const rows = await db.query.sale.findMany({
    where: and(
      eq(sale.shopId, shopId),
      gte(sale.saleDate, start),
      lte(sale.saleDate, end),
    ),
    columns: { paymentStatus: true, totalAmount: true },
  });

  const statuses = [
    "pending",
    "partial",
    "paid",
    "overdue",
    "cancelled",
  ] as const;
  return statuses.map((status) => {
    const matching = rows.filter((r) => r.paymentStatus === status);
    return {
      status,
      count: matching.length,
      amount: matching.reduce((sum, r) => sum + r.totalAmount, 0),
    };
  });
}

// --- Always current (ignores the filter — these are "right now" snapshots,
// not "during this period" activity, so filtering them would make them less
// useful, not more) ---

export async function getCurrentSalesStats(shopId: string) {
  const sales = await db.query.sale.findMany({
    where: eq(sale.shopId, shopId),
    columns: { balance: true, paymentStatus: true },
  });
  const active = sales.filter((s) => s.paymentStatus !== "cancelled");

  return { outstandingBalance: active.reduce((sum, s) => sum + s.balance, 0) };
}

export async function getCurrentPurchasesStats(shopId: string) {
  const purchases = await db.query.purchase.findMany({
    where: eq(purchase.shopId, shopId),
    columns: { purchaseStatus: true },
  });
  const pendingStatuses = new Set(["draft", "ordered", "shipped"]);

  return {
    pendingCount: purchases.filter((p) => pendingStatuses.has(p.purchaseStatus))
      .length,
  };
}

export async function getPurchaseStatusBreakdown(shopId: string) {
  const purchases = await db.query.purchase.findMany({
    where: eq(purchase.shopId, shopId),
    columns: { purchaseStatus: true, totalAmount: true },
  });

  const statuses = [
    "draft",
    "ordered",
    "shipped",
    "received",
    "cancelled",
  ] as const;
  return statuses.map((status) => {
    const matching = purchases.filter((p) => p.purchaseStatus === status);
    return {
      status,
      count: matching.length,
      amount: matching.reduce((sum, p) => sum + p.totalAmount, 0),
    };
  });
}

// totalInventoryValue = current stock quantity x cost (what you paid), not
// selling price — the standard "what's tied up in stock" figure.
export async function getInventoryOverviewForShop(shopId: string) {
  const products = await db.query.product.findMany({
    where: and(eq(product.shopId, shopId), isNull(product.deletedAt)),
    columns: { name: true, quantity: true, restockLevel: true, cost: true },
  });
  const lowStock = products.filter((p) => p.quantity <= p.restockLevel);

  return {
    totalProducts: products.length,
    totalStockQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
    totalInventoryValue: products.reduce(
      (sum, p) => sum + p.quantity * p.cost,
      0,
    ),
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 5).map((p) => ({
      name: p.name,
      quantity: p.quantity,
      restockLevel: p.restockLevel,
    })),
  };
}
