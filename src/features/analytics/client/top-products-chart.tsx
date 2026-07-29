"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TopProductPoint = {
  productName: string;
  revenue: number;
  quantity: number;
};

export function TopProductsChart({
  data,
  currency,
}: {
  data: TopProductPoint[];
  currency: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            type="category"
            dataKey="productName"
            tick={{ fontSize: 12 }}
            stroke="var(--muted-foreground)"
            width={110}
          />
          <Tooltip
            formatter={(value) => [
              `${currency} ${Number(value ?? 0).toLocaleString()}`,
              "Revenue",
            ]}
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
