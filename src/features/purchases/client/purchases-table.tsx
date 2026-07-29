"use client";

import * as React from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export type PurchaseRow = {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  purchaseStatus: string;
  paymentStatus: string;
  totalAmount: number;
  purchaseDate: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  ordered: "text-blue-600",
  shipped: "text-amber-600",
  received: "text-green-600",
  cancelled: "text-destructive",
  pending: "text-muted-foreground",
  partial: "text-amber-600",
  paid: "text-green-600",
  overdue: "text-destructive",
};

export function PurchasesTable({
  currency,
  purchases,
}: {
  currency: string;
  purchases: PurchaseRow[];
}) {
  const columns = React.useMemo<ColumnDef<PurchaseRow>[]>(
    () => [
      {
        id: "number",
        header: "Order",
        cell: ({ row }) => (
          <Link
            href={`/admin/purchases/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.purchaseNumber}
          </Link>
        ),
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.purchaseDate).toLocaleDateString(),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className={STATUS_COLORS[row.original.purchaseStatus] ?? ""}>
            {row.original.purchaseStatus}
          </span>
        ),
      },
      {
        id: "payment",
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
    ],
    [currency],
  );

  const table = useReactTable({
    data: purchases,
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
          {purchases.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-muted-foreground px-3 py-6 text-center"
              >
                No purchase orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
