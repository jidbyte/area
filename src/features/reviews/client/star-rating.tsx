"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export function StarRatingDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const rounded = Math.round(rating);
  const sizeClass = size === "md" ? "size-4" : "size-2.5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            sizeClass,
            n <= rounded
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} out of 5`}
        >
          <Star
            className={cn(
              "size-6",
              active >= n
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
