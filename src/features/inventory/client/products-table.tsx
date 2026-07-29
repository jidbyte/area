"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Button } from "@/shared/components/ui/button";
import { placeholderAssets } from "@/assets/placeholder";
import { formatPrice } from "@/shared/utils/currency";
import { deleteProduct } from "@/features/inventory/server/actions";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  restockLevel: number;
  isActive: boolean;
  primaryImageUrl: string | null;
  categories: string[];
};

export function ProductsTable({
  currency,
  products,
}: {
  currency: string;
  products: ProductRow[];
}) {
  const [isPending, startTransition] = React.useTransition();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<ProductRow>[]>(
    () => [
      {
        id: "image",
        header: "",
        cell: ({ row }) => (
          <div className="bg-secondary relative size-10 overflow-hidden rounded-md">
            <Image
              src={row.original.primaryImageUrl || placeholderAssets.noImage}
              alt={row.original.name}
              fill
              unoptimized={!!row.original.primaryImageUrl}
              className="object-cover"
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">{row.original.sku}</p>
          </div>
        ),
      },
      {
        id: "categories",
        header: "Category",
        cell: ({ row }) => row.original.categories.join(", ") || "—",
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => formatPrice(row.original.price, currency),
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const low = row.original.quantity <= row.original.restockLevel;
          return (
            <span className={low ? "text-destructive font-medium" : ""}>
              {row.original.quantity}
              {low && " (low)"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/products/${row.original.id}/edit`}>Edit</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending && pendingId === row.original.id}
              onClick={() => {
                setPendingId(row.original.id);
                startTransition(async () => {
                  await deleteProduct(row.original.id);
                });
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [currency, isPending, pendingId],
  );

  const table = useReactTable({
    data: products,
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
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
          {products.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-muted-foreground px-3 py-6 text-center">
                No products yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
