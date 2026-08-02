import Image from "next/image";
import Link from "next/link";

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { placeholderAssets } from "@/assets/placeholder";
import { getShopBySlug } from "@/features/shops/server/queries";
import { getActiveProductById } from "@/features/inventory/server/queries";
import { ShopHeader } from "@/features/shops/client/shop-header";
import { formatPrice } from "@/shared/utils/currency";
import { AddToCartButton } from "@/features/cart/client/add-to-cart-button";
import {
  RatingSummary,
  ReviewListItem,
  ReviewsList,
} from "@/features/reviews/client/reviews-list";
import {
  getReviewSummaryForProduct,
  getReviewsForProduct,
  getReviewByBuyerForProduct,
  getEligibleSaleItemForReview,
} from "@/features/reviews/server/queries";
import { isMemberOfShopOrg } from "@/features/shops/server/membership";
import { ReviewForm } from "@/features/reviews/client/review-form";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ shop: string; productId: string }>;
}) {
  const { shop: slug, productId } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const product = await getActiveProductById(shop.id, productId);
  if (!product) notFound();

  const images = product.images.length > 0 ? product.images : null;
  const primary = images?.find((i) => i.isPrimary) ?? images?.[0];
  const outOfStock = product.quantity <= 0;
  const categories = product.productCategories.map((pc) => pc.category.name);

  const { userId } = await auth();
  const [reviewSummary, reviews, myReview, isStaff] = await Promise.all([
    getReviewSummaryForProduct(product.id),
    getReviewsForProduct(product.id),
    userId
      ? getReviewByBuyerForProduct(product.id, userId)
      : Promise.resolve(null),
    userId
      ? isMemberOfShopOrg(userId, shop.clerkOrgId)
      : Promise.resolve(false),
  ]);
  const isEligibleForNewReview =
    !myReview && userId
      ? await getEligibleSaleItemForReview(shop.id, product.id, userId)
      : null;

  const reviewListItems: ReviewListItem[] = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    buyerName: r.buyerName,
    createdAt: r.createdAt,
    canDelete: r.buyerClerkUserId === userId || isStaff,
  }));

  return (
    <div>
      <ShopHeader shopId={shop.id} slug={slug} name={shop.name} />

      <div className="mx-auto max-w-5xl p-8">
        <Link
          href={`/${slug}`}
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
              {formatPrice(product.price, shop.currency)}
            </p>

            <RatingSummary
              averageRating={reviewSummary.averageRating}
              reviewCount={reviewSummary.reviewCount}
            />

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
              maxQuantity={product.quantity}
              showQuantitySelector
            />

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/${slug}/category/${encodeURIComponent(c)}`}
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

      <div className="mt-12 space-y-6 border-t pt-8">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <ReviewsList reviews={reviewListItems} />

        <div className="border-t pt-6">
          {!userId ? (
            <p className="text-muted-foreground text-sm">
              <Link
                href={`/sign-in?redirect_url=/${slug}/product/${product.id}`}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>{" "}
              to write a review.
            </p>
          ) : myReview ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Edit your review</h3>
              <ReviewForm
                shopId={shop.id}
                productId={product.id}
                defaultValues={{
                  rating: myReview.rating,
                  title: myReview.title ?? "",
                  body: myReview.body,
                }}
              />
            </div>
          ) : isEligibleForNewReview ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Write a review</h3>
              <ReviewForm shopId={shop.id} productId={product.id} />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Purchase this product to leave a review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
