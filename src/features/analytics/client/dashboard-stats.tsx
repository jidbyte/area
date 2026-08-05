import { PackageMinus, Receipt, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/features/analytics/client/stat-card";

export function DashboardStats({
  currencySymbol,
  totalSalesRevenue,
  netProfit,
  totalSalesCount,
  inventorySpend,
  pendingPurchaseOrders,
  totalInventoryValue,
  totalStockQuantity,
}: {
  currencySymbol: string;
  totalSalesRevenue: number;
  netProfit: number;
  totalSalesCount: number;
  inventorySpend: number;
  pendingPurchaseOrders: number;
  totalInventoryValue: number;
  totalStockQuantity: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-6 my-10 lg:grid-cols-4">
      <StatCard
        label="Total sales revenue"
        value={`${currencySymbol}${totalSalesRevenue.toLocaleString()}`}
        trend={{
          value: `${netProfit >= 0 ? "+" : "-"}${currencySymbol}${Math.abs(
            netProfit,
          ).toLocaleString()} net profit`,
          direction: netProfit >= 0 ? "up" : "down",
        }}
        icon={TrendingUp}
      />
      <StatCard
        label="Sales transactions"
        value={String(totalSalesCount)}
        hint={
          pendingPurchaseOrders > 0
            ? `${pendingPurchaseOrders} purchase order${pendingPurchaseOrders === 1 ? "" : "s"} awaiting receipt`
            : undefined
        }
        icon={Receipt}
      />
      <StatCard
        label="Inventory spend"
        value={`${currencySymbol}${inventorySpend.toLocaleString()}`}
        hint={
          pendingPurchaseOrders > 0
            ? `${pendingPurchaseOrders} pending order${pendingPurchaseOrders === 1 ? "" : "s"}`
            : undefined
        }
        icon={PackageMinus}
      />
      <StatCard
        label="Total inventory value"
        value={`${currencySymbol}${totalInventoryValue.toLocaleString()}`}
        hint={`${totalStockQuantity.toLocaleString()} units in stock`}
        icon={Wallet}
      />
    </div>
  );
}
