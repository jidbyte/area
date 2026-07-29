"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type RevenueProfitPoint = {
  date: string;
  revenue: number;
  profit: number;
};

export function RevenueProfitChart({
  data,
  currency,
}: {
  data: RevenueProfitPoint[];
  currency: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) =>
              new Date(d).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            tick={{ fontSize: 12 }}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="var(--muted-foreground)"
            width={50}
          />
          <Tooltip
            formatter={(value, name) => [
              `${currency} ${Number(value ?? 0).toLocaleString()}`,
              name === "revenue" ? "Revenue" : "Profit (est.)",
            ]}
            labelFormatter={(label) =>
              new Date(String(label)).toLocaleDateString()
            }
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
