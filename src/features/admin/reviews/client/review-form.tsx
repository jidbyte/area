"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  reviewSchema,
  type ReviewInput,
} from "@/features/admin/reviews/server/schema";
import { upsertReview } from "@/features/admin/reviews/server/actions";
import { StarRatingInput } from "./star-rating";

export function ReviewForm({
  shopId,
  productId,
  defaultValues,
}: {
  shopId: string;
  productId: string;
  defaultValues?: Partial<ReviewInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", body: "", ...defaultValues },
  });

  const onSubmit = (values: ReviewInput) => {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await upsertReview(shopId, productId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Your rating</label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.rating && (
          <p className="text-destructive text-sm">{errors.rating.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title (optional)
        </label>
        <Input id="title" {...register("title")} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          Your review
        </label>
        <textarea
          id="body"
          rows={4}
          className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
          {...register("body")}
        />
        {errors.body && (
          <p className="text-destructive text-sm">{errors.body.message}</p>
        )}
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      {saved && !serverError && (
        <p className="text-sm text-green-600">Thanks for your review!</p>
      )}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending ? "Saving..." : "Submit review"}
      </Button>
    </form>
  );
}
