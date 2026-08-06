import Image from "next/image";
import Link from "next/link";

import { notFound } from "next/navigation";
import { placeholderAssets } from "@/assets/placeholder";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { getActiveProductById } from "@/features/admin/products/server/queries";
import { ShopHeader } from "@/features/app/stores/client/shop-header";
import { formatPrice } from "@/shared/utils/currency";
import { AddToCartButton } from "@/features/app/payments/client/add-to-cart-button";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ store: string; productId: string }>;
}) {
  const { store: slug, productId } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const product = await getActiveProductById(shop.id, productId);
  if (!product) notFound();

  const images = product.images.length > 0 ? product.images : null;
  const primary = images?.find((i) => i.isPrimary) ?? images?.[0];
  const outOfStock = product.quantity <= 0;
  const categories = product.productCategories.map((pc) => pc.category.name);

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />

      <div className="mx-auto max-w-5xl p-8">
        <Link
          href={`/stores/${slug}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to {shop.name}
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="bg-secondary relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={primary?.url ?? placeholderAssets.noImage}
                alt={product.name}
                fill
                unoptimized={!!primary}
                className="object-contain p-8"
              />
            </div>
            {images && images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img) => (
                  <div
                    key={img.fileKey}
                    className="bg-secondary relative aspect-square overflow-hidden rounded-md"
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              {(product.brand || product.model) && (
                <p className="text-muted-foreground text-sm">
                  {[product.brand, product.model].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <p className="text-primary text-2xl font-semibold">
              {formatPrice(product.sellingPrice, shop.currency)}
            </p>

            <p
              className={
                outOfStock ? "text-destructive text-sm font-medium" : "text-sm"
              }
            >
              {outOfStock ? "Out of stock" : "In stock"}
            </p>

            <AddToCartButton
              shopId={shop.id}
              shopSlug={slug}
              productId={product.id}
              productName={product.name}
              sellingPrice={product.sellingPrice}
              imageUrl={primary?.url ?? null}
              maxQuantity={product.quantity}
              showQuantitySelector
            />

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/stores/${slug}/category/${encodeURIComponent(c)}`}
                    className="bg-secondary hover:bg-accent rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            )}

            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
