import {
  AlertTriangle,
  ArrowRight,
  Package,
  PackageX,
  Trophy,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import Link from "next/link";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LowStockCard({
  products,
}: {
  products: { name: string; quantity: number; restockLevel: number }[];
}) {
  if (products.length === 0) return null;

  return (
    <Card className="bg-warning/5 border-warning/50">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base md:text-xl">Low Stock</CardTitle>

          <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-warning">
            <AlertTriangle className="size-3" />
            {products.length} Products
          </span>
      </CardHeader>

      <CardContent className="space-y-1 -mt-4">
        {products.map((p) => {
          const pct =
            p.restockLevel > 0
              ? Math.min(100, (p.quantity / p.restockLevel) * 100)
              : 0;
          return (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 hover:bg-muted"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-neutral">
                <Package className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium text-ink">
                  {p.name}
                </p>
                <div className="h-1 w-full overflow-hidden rounded-full bg-neutral/80">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-amber-700 dark:text-warning">
                {p.quantity} left
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function RecentSalesCard({
  sales,
  currencySymbol,
}: {
  sales: {
    id: string;
    saleNumber: string;
    customerName: string;
    totalAmount: number;
  }[];
  currencySymbol: string;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base md:text-xl">Recent Sales</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5 -mt-4">
        {sales.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral">
            No sales recorded yet.
          </p>
        ) : (
          sales.map((s) => (
            <Link
              key={s.id}
              href={`/admin/sales/${s.id}`}
              className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors bg-accent/20 hover:bg-accent/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink/80 text-xs font-semibold text-surface">
                {initials(s.customerName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {s.customerName}
                </p>
                <p className="truncate text-xs text-neutral">{s.saleNumber}</p>
              </div>
              <span className="shrink-0 rounded-full bg-success/10 px-2 py-1 text-sm tracking-wider font-semibold text-success">
                +{currencySymbol}
                {s.totalAmount.toLocaleString()}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function BestSellingProductsCard({
  products,
  currencySymbol,
}: {
  products: { productName: string; quantity: number; revenue: number }[];
  currencySymbol: string;
}) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-xl">
            Best Sellers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-neutral">
            No sales in this period yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-xl">
          Best selling products
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-0.5 -mt-4">
        {products.map((p, i) => (
          <div
            key={p.productName}
            className="flex items-start gap-4 rounded-md px-2 py-2 -mx-2 mb-2 bg-solid/5 hover:bg-solid/15"
          >
            <span className="w-6 h-6 shrink-0 text-sm rounded-full bg-solid text-surface grid place-content-center font-bold tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {p.productName}
              </p>
              <p className="text-xs text-ink/60 text-semibold">{p.quantity} sold</p>
            </div>

            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
              {currencySymbol}
              {p.revenue.toLocaleString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
