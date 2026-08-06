"use client";

import * as React from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/shared/components/ui/button";
import { deleteCustomer } from "@/features/admin/customers/server/actions";

export type CustomerRow = {
  id: string;
  name: string;
  customerType: string;
  email: string | null;
  phone: string | null;
};

export function CustomersTable({
  customers,
  shopSlug,
}: {
  customers: CustomerRow[];
  shopSlug: string;
}) {
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<CustomerRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs capitalize">
              {row.original.customerType}
            </p>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || "—",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/${shopSlug}/customers/${row.original.id}/edit`}>
                Edit
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending && pendingId === row.original.id} loading={isPending && pendingId === row.original.id}
              onClick={() => {
                setPendingId(row.original.id);
                startTransition(async () => {
                  await deleteCustomer(row.original.id);
                });
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [isPending, pendingId, shopSlug],
  );

  const table = useReactTable({
    data: customers,
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
          {customers.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-muted-foreground px-3 py-6 text-center"
              >
                No customers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
