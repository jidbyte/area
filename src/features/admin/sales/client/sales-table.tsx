"use client";

import * as React from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export type SaleRow = {
  id: string;
  saleNumber: string;
  customerName: string;
  paymentStatus: string;
  totalAmount: number;
  balance: number;
  saleDate: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  partial: "text-amber-600",
  paid: "text-green-600",
  overdue: "text-destructive",
  cancelled: "text-destructive",
};

export function SalesTable({
  currency,
  sales,
  shopSlug,
}: {
  currency: string;
  sales: SaleRow[];
  shopSlug: string;
}) {
  const columns = React.useMemo<ColumnDef<SaleRow>[]>(
    () => [
      {
        id: "number",
        header: "Sale",
        cell: ({ row }) => (
          <Link
            href={`/${shopSlug}/transactions/sales/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.saleNumber}
          </Link>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => new Date(row.original.saleDate).toLocaleDateString(),
      },
      {
        id: "status",
        header: "Payment",
        cell: ({ row }) => (
          <span className={STATUS_COLORS[row.original.paymentStatus] ?? ""}>
            {row.original.paymentStatus}
          </span>
        ),
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) =>
          `${currency} ${row.original.totalAmount.toLocaleString()}`,
      },
      {
        id: "balance",
        header: "Balance",
        cell: ({ row }) =>
          row.original.balance > 0 ? (
            <span className="text-amber-600">
              {currency} {row.original.balance.toLocaleString()}
            </span>
          ) : (
            "—"
          ),
      },
    ],
    [currency, shopSlug],
  );

  const table = useReactTable({
    data: sales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 text-left font-medium">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {sales.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-muted-foreground px-3 py-6 text-center"
              >
                No sales yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
