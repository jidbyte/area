import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Tag,
  Barcode,
  Layers,
  Info,
  Package,
  CircleDollarSign,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BanknoteCheck,
  Dot,
  Box,
  SquarePen,
} from "lucide-react";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getProductById } from "@/features/admin/products/server/queries";
import { formatPrice } from "@/shared/utils/currency";
import { ProductImageGallery } from "@/features/admin/products/client/image-gallery";
import {
  PageAction,
  PageHeader,
  PageTitle,
} from "@/shared/components/common/page-header";
import { placeholderAssets } from "@/assets/placeholder";
import { cn } from "@/shared/lib/utils";
import {
  AdjustStockDialog,
  DeleteProductDialog,
} from "@/features/admin/products/client/product-actions";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

function getStockStatus(quantity: number, restockLevel: number) {
  if (quantity <= 0)
    return {
      label: "Out of stock",
      badgeClassName: "bg-danger/10 text-danger",
      textClassName: "text-danger",
    };
  if (quantity <= restockLevel)
    return {
      label: "Low stock",
      badgeClassName: "bg-warning/10 text-warning",
      textClassName: "text-warning",
    };
  return {
    label: "Available",
    badgeClassName: "bg-success/10 text-success",
    textClassName: "text-success",
  };
}

function calculateMargin(costPrice: number, sellingPrice: number) {
  if (sellingPrice === 0) return "0.0";
  return (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { storeSlug, productId } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const product = await getProductById(productId);
  if (!product || product.shopId !== shop.id) notFound();

  const categories = product.productCategories.map((pc) => pc.category.name);
  const stockStatus = getStockStatus(product.quantity, product.restockLevel);
  const margin = calculateMargin(product.costPrice, product.sellingPrice);

  const money = (amount: number) => formatPrice(amount, shop.currency);

  return (
    <div>
      <PageHeader>
        <PageTitle icon={Box}>{product.name}</PageTitle>

        <PageAction>
          <AdjustStockDialog
            productId={productId}
            currentQuantity={product.quantity}
          />

          <Button asChild shape="round" variant="secondary">
            <Link href={`/${storeSlug}/products/${productId}/edit`}>
              <SquarePen /> Edit
            </Link>
          </Button>

          <DeleteProductDialog productId={productId} shopSlug={storeSlug} />
        </PageAction>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
        {/* Image carousel */}
        <div className="mb-6 md:mr-6">
          {product.images.length > 0 ? (
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          ) : (
            <div className="bg-muted/40 border-border relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={placeholderAssets.noImage}
                alt={product.name}
                fill
                priority
                className="w-full block object-cover "
              />
            </div>
          )}
        </div>

        <div className="col-span-3 space-y-6">
          {/* Product details */}
          <div className="border p-4 md:p-6 rounded-md w-full">
            <h2 className="flex items-center gap-2 mb-4 font-semibold text-sm uppercase tracking-widest">
              <Info className="size-4" />
              <span>Overview</span>
            </h2>

            <div className="flex flex-col md:flex-row gap-6 md:gap-20">
              <div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="text-neutral size-4" />
                    <span className="text-neutral">Brand:</span>
                    <span className="text-ink">{product.brand || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="text-neutral size-4" />
                    <span className="text-neutral">Model:</span>
                    <span className="text-ink">{product.model || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Barcode className="text-neutral size-4" />
                    <span className="text-neutral">SKU:</span>
                    <span className="text-ink font-mono">{product.sku}</span>
                  </div>
                  {product.code && (
                    <div className="flex items-center gap-2 text-sm">
                      <Barcode className="text-neutral size-4" />
                      <span className="text-neutral">Code:</span>
                      <span className="text-ink font-mono">{product.code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                {product.description && (
                  <p className="text-ink text-sm">{product.description}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              {categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="bg-muted/40 text-ink rounded-full px-2.5 py-0.5 text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-fit">
            {/* Stock statistics */}
            <div className="col-span-2 border p-4 md:p-6 rounded-md w-full">
              <h2 className="flex items-center justify-between gap-2 mb-4">
                <span className="flex items-center gap-2 font-semibold text-sm uppercase tracking-widest">
                  <Package className="size-4" />
                  <span>Stock</span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1",
                    stockStatus.badgeClassName,
                  )}
                >
                  <Dot className="size-6 -mx-2 animate-pulse" />{" "}
                  {stockStatus.label}
                </span>
              </h2>

              <div className="space-y-4">
                <div className="bg-muted/40 text-neutral flex justify-between rounded-md p-2.5 md:px-4">
                  <span>Quantity In Stock</span>
                  <strong
                    className={cn("md:text-lg", stockStatus.textClassName)}
                  >
                    {product.quantity}
                  </strong>
                </div>

                <div className="bg-muted/40 text-neutral flex justify-between rounded-md p-2.5 md:px-4">
                  <span>Restock At</span>
                  <strong className="md:text-lg">
                    {product.restockLevel}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="col-span-3 border p-4 md:p-6 rounded-md w-full">
              <h2 className="flex items-center gap-2 mb-4 font-semibold text-sm uppercase tracking-widest">
                <CircleDollarSign className="size-4" />
                <span>Valuation</span>
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center space-y-2.5">
                  <div className="mb-2 flex justify-center">
                    <BanknoteArrowDown className="bg-warning/10 text-warning size-10 rounded-lg p-2" />
                  </div>
                  <p className="text-neutral font-medium">Cost Price</p>
                  <p className="text-warning text-2xl font-bold">
                    {money(product.costPrice)}
                  </p>
                </div>

                <div className="text-center space-y-2.5">
                  <div className="mb-2 flex justify-center">
                    <BanknoteArrowUp className="bg-info/10 text-info size-10 rounded-lg p-2" />
                  </div>
                  <p className="text-neutral font-medium">Selling Price</p>
                  <p className="text-info text-2xl font-bold">
                    {money(product.sellingPrice)}
                  </p>
                </div>

                <div className="text-center space-y-2.5">
                  <div className="mb-2 flex justify-center">
                    <BanknoteCheck
                      className={cn(
                        "size-10 rounded-lg p-2",
                        Number(margin) > 0
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger",
                      )}
                    />
                  </div>
                  <p className="text-neutral font-medium">Profit Margin</p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      Number(margin) > 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {margin}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
