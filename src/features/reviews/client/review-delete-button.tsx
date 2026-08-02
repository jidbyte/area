"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { deleteReview } from "@/features/reviews/server/actions";

export function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => setConfirming(true)}
      >
        Remove
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span>Remove this review?</span>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteReview(reviewId);
            if (!result.success) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        Yes
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      {error && <span className="text-destructive">{error}</span>}
    </div>
  );
}
