import Link from "next/link";
import { Package, PlusCircle, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

export function ProductsEmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-border bg-accent/20 px-6 py-16 text-center">
      <div className="relative flex size-24 items-center justify-center rounded-full bg-surface border border-neutral/50">
        <Package className="size-10 md:size-12 text-neutral" />
        <span className="absolute -right-1.5 -top-1.5 flex size-8 items-center justify-center rounded-full bg-neutral text-surface">
          <X className="size-4 " />
        </span>
      </div>

      <div className="space-y-2.5 text-ink/80">
        <h2 className="text-xl font-bold md:text-2xl">No products yet</h2>
        <p className="mx-auto max-w-sm text-sm">
          Add products to start tracking your inventory, orders, and revenue for
          your business.
        </p>
      </div>

      <Button asChild size="lg" className="gap-2 font-semibold">
        <Link href="/admin/products/new">
          <PlusCircle className="size-4" />
          Add your first product
        </Link>
      </Button>
    </div>
  );
}
