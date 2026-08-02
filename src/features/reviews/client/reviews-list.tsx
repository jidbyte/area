import { StarRatingDisplay } from "./star-rating";
import { ReviewDeleteButton } from "./review-delete-button";

export type ReviewListItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  buyerName: string;
  createdAt: Date | string;
  canDelete: boolean;
};

export function RatingSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number;
  reviewCount: number;
}) {
  if (reviewCount === 0) {
    return <p className="text-muted-foreground text-sm">No reviews yet.</p>;
  }
  return (
    <div className="flex items-center gap-2">
      <StarRatingDisplay rating={averageRating} size="md" />
      <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">
        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
      </span>
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: ReviewListItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No reviews yet — be the first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={r.rating} />
              <span className="text-sm font-medium">{r.buyerName}</span>
            </div>
            <span className="text-muted-foreground text-xs">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
          <p className="text-muted-foreground mt-1 text-sm">{r.body}</p>
          {r.canDelete && (
            <div className="mt-1">
              <ReviewDeleteButton reviewId={r.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
