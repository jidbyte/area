"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Dot,
  PackageX,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent } from "@/shared/components/ui/card";
import { placeholderAssets } from "@/assets/placeholder";
import { formatPrice } from "@/shared/utils/currency";
import { cn } from "@/shared/lib/utils";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  brand?: string;
  model?: string;
  price: number;
  quantity: number;
  restockLevel: number;
  isActive: boolean;
  primaryImageUrl: string | null;
  categories: string[];
};

function SortButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center h-8 gap-1.5 font-medium text-ink hover:text-ink/60 cursor-pointer"
    >
      <span className="text-xs uppercase tracking-wider font-bold">
        {label}
      </span>
      <ArrowUpDown className="size-3.5" />
    </button>
  );
}

export function createProductColumns(
  currency: string,
): ColumnDef<ProductRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
      enableSorting: false,
    },
    {
      id: "image",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="bg-muted relative size-12 overflow-hidden rounded-sm">
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
      header: ({ column }) => (
        <SortButton
          label="Name"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const subtitle =
          [row.original.brand, row.original.model]
            .filter(Boolean)
            .join(" · ") || row.original.sku;
        return (
          <div className="truncate">
            <p className="font-medium text-ink">{row.original.name}</p>
            <p className="text-xs text-ink/70">{subtitle}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="text-ink/70 text-sm truncate">{row.original.sku}</span>
      ),
    },
    {
      id: "categories",
      header: "Category",
      enableSorting: false,
      cell: ({ row }) => {
        const categories = row.original.categories;
        if (categories.length === 0) {
          return <span className="text-neutral">—</span>;
        }

        const [first, ...rest] = categories;

        return (
          <div className="flex flex-wrap gap-1">
            <Badge className="font-normal">{first}</Badge>
            {rest.length > 0 && (
              <Badge className="font-normal">+{rest.length}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <SortButton
          label="Price"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const price = formatPrice(row.original.price, currency);
        return (
          <span className="text-green-700 dark:text-green-300">{price}</span>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <SortButton
          label="In Stock"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const { quantity, restockLevel } = row.original;
        const low = quantity > 0 && quantity <= restockLevel;

        if (quantity === 0) {
          return (
            <Badge variant="destructive" className="font-normal">
              Out of stock
            </Badge>
          );
        }

        return (
          <span className={cn("font-semibold", low ? "text-ink" : "text-ink")}>
            {quantity}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end -ml-8">
          <Button asChild size="sm" variant="link">
            <Link href={`/admin/products/${row.original.id}`}>
              View details <ArrowRight />
            </Link>
          </Button>
        </div>
      ),
    },
  ];
}

export function ProductsTable({
  currency,
  products,
  rowSelection,
  onRowSelectionChange,
}: {
  currency: string;
  products: ProductRow[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (state: RowSelectionState) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = React.useMemo(
    () => createProductColumns(currency),
    [currency],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;

  return (
    <div className="space-y-3">
      {/* Desktop / tablet: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader className="bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs uppercase tracking-wider font-bold text-ink"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-l-2 border-l-transparent transition-colors hover:bg-muted/40",
                    row.getIsSelected() && "border-l-primary bg-primary/5",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center text-neutral"
                >
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <PackageX className="size-12 text-neutral" />
                    <p className="text-ink/80 text-base mt-2">
                      No matching results. <br /> Try a different search.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card list */}
      <div className="divide-y divide-border rounded-lg border border-border md:hidden">
        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <PackageX className="size-8 text-neutral" />
            <p className="text-ink/80">
              No matching results. <br /> Try a different search.
            </p>
          </div>
        )}

        {rows.map((row) => {
          const p = row.original;
          const low = p.quantity <= p.restockLevel;
          const subtitle =
            [p.brand, p.model].filter(Boolean).join(" · ") || p.sku;
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 p-3",
                row.getIsSelected() && "bg-muted",
              )}
            >
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
                aria-label={`Select ${p.name}`}
              />

              <div className="bg-muted relative size-11 shrink-0 overflow-hidden rounded-sm">
                <Image
                  src={p.primaryImageUrl || placeholderAssets.noImage}
                  alt={p.name}
                  fill
                  unoptimized={!!p.primaryImageUrl}
                  className="object-cover"
                />
              </div>

              <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink hover:underline">
                  {p.name}
                </p>
                <div className="flex items-center gap-0.5 text-xs text-ink/60">
                  <span className="truncate">{subtitle}</span>
                  {p.categories[0] && (
                    <>
                      <Dot className="size-5" />
                      <span className="truncate">{p.categories[0]}</span>
                    </>
                  )}
                </div>
              </Link>

              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-ink">
                  {formatPrice(p.price, currency)}
                </p>
                <p
                  className={cn(
                    "text-xs font-medium tracking-wide",
                    p.quantity === 0
                      ? "text-danger"
                      : low
                        ? "text-amber-600 dark:text-amber-300"
                        : "text-solid",
                  )}
                >
                  {p.quantity === 0 ? "Out of stock" : `${p.quantity} in stock`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pageCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <span>Rows per page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) =>
                setPagination((p) => ({
                  ...p,
                  pageSize: Number(v),
                  pageIndex: 0,
                }))
              }
            >
              <SelectTrigger className="h-6 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/60">
              Page {currentPage} of {pageCount}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
