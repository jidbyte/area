"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { StarRatingDisplay } from "./star-rating";
import { ReviewForm } from "./review-form";
import type { ReviewInput } from "@/features/admin/reviews/server/schema";

export function OrderItemReviewButton({
  shopId,
  productId,
  productName,
  existingReview,
}: {
  shopId: string;
  productId: string;
  productName: string;
  existingReview?: { rating: number; title: string | null; body: string } | null;
}) {
  const [open, setOpen] = useState(false);

  const defaultValues: Partial<ReviewInput> | undefined = existingReview
    ? { rating: existingReview.rating, title: existingReview.title ?? "", body: existingReview.body }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existingReview ? (
          <button className="flex items-center gap-2 text-sm text-primary hover:underline">
            <StarRatingDisplay rating={existingReview.rating} /> Edit your review
          </button>
        ) : (
          <Button variant="outline" size="sm">
            Rate &amp; review
          </Button>
        )}
      </DialogTrigger>

      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{productName}</DialogTitle>
        </DialogHeader>
        <ReviewForm shopId={shopId} productId={productId} defaultValues={defaultValues} />
      </DialogContent>
    </Dialog>
  );
}
