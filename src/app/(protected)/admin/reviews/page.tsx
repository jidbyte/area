import { redirect } from "next/navigation";
import Link from "next/link";

import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { listReviewsForShop } from "@/features/reviews/server/queries";
import { StarRatingDisplay } from "@/features/reviews/client/star-rating";
import { ReviewDeleteButton } from "@/features/reviews/client/review-delete-button";

export default async function AdminReviewsPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const reviews = await listReviewsForShop(shop.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reviews</h1>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRatingDisplay rating={r.rating} />
                  <span className="text-sm font-medium">{r.buyerName}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Link
                href={`/${shop.slug}/product/${r.productId}`}
                className="text-primary text-xs hover:underline"
              >
                {r.productName}
              </Link>
              {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
              <p className="text-muted-foreground mt-1 text-sm">{r.body}</p>
              <div className="mt-2">
                <ReviewDeleteButton reviewId={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
