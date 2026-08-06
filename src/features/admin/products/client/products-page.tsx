"use client";

import * as React from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import Link from "next/link";
import type { RowSelectionState } from "@tanstack/react-table";
import { Download, Package, PlusCircle, Search, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  PageHeader,
  PageTitle,
  PageAction,
} from "@/shared/components/common/page-header";
import {
  ProductsTable,
  type ProductRow,
} from "@/features/admin/products/client/products-table";
import { deleteProduct } from "@/features/admin/products/server/actions";

const ALL_CATEGORIES = "__all__";

function exportToCsv(rows: ProductRow[]) {
  const header = [
    "Name",
    "SKU",
    "Category",
    "Price",
    "Quantity",
    "Restock level",
    "Status",
  ];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const lines = rows.map((r) =>
    [
      escape(r.name),
      escape(r.sku),
      escape(r.categories.join("; ")),
      escape(r.sellingPrice),
      escape(r.quantity),
      escape(r.restockLevel),
      escape(r.isActive ? "Active" : "Inactive"),
    ].join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProductsPageClient({
  currency,
  products,
  shopSlug,
}: {
  currency: string;
  products: ProductRow[];
  shopSlug: string;
}) {
  const [isPending, startTransition] = useActionTransition();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState(ALL_CATEGORIES);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [exportOpen, setExportOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [products]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchesCategory =
        category === ALL_CATEGORIES || p.categories.includes(category);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  );
  const selectedCount = selectedIds.length;

  const handleConfirmBulkDelete = () => {
    startTransition(async () => {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      setRowSelection({});
      setDeleteDialogOpen(false);
    });
  };

  const handleConfirmExport = () => {
    const toExport =
      selectedCount > 0 ? filtered.filter((p) => rowSelection[p.id]) : filtered;
    exportToCsv(toExport);
    setExportOpen(false);
  };

  const exportCount = selectedCount > 0 ? selectedCount : filtered.length;

  return (
    <div className="space-y-4">
      <PageHeader>
        <PageTitle icon={Package}>
          <div className="flex items-center gap-2">
            <span>Products</span>
            <span className="rounded-full bg-neutral px-2 py-0.5 text-xs text-white">
              {products.length}
            </span>
          </div>
        </PageTitle>

        <PageAction>
          <Button asChild variant="secondary" shape="round">
            <Link href={`/${shopSlug}/products/new`}>
              <PlusCircle className="size-4" /> Add product
            </Link>
          </Button>

          <Popover open={exportOpen} onOpenChange={setExportOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                shape="round"
                className="gap-2 hidden md:inline-flex"
              >
                <Download className="size-3.5" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink">Export as CSV</p>
                <p className="text-xs text-neutral">
                  {exportCount} product{exportCount === 1 ? "" : "s"} will be
                  exported.{" "}
                </p>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleConfirmExport}
              >
                Download
              </Button>
            </PopoverContent>
          </Popover>
        </PageAction>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-neutral"
            icon={Search}
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              shape="round"
              disabled={isPending} loading={isPending}
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="size-4" />
              Delete ({selectedCount})
            </Button>
          )}

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductsTable
        currency={currency}
        products={filtered}
        shopSlug={shopSlug}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isPending) setDeleteDialogOpen(open);
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              Delete {selectedCount} product{selectedCount === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              They&apos;ll be removed from your catalog and storefront. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending} loading={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isPending} loading={isPending}
              onClick={handleConfirmBulkDelete}
            >
              {isPending ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
