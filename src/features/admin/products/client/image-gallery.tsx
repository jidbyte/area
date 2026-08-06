"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/shared/lib/utils";
import { placeholderAssets } from "@/assets/placeholder";

export type GalleryImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

/**
 * Main image + clickable thumbnail strip. Clicking a thumbnail swaps the
 * large image — no external carousel library needed for this many images.
 */
export function ProductImageGallery({
  images,
  productName,
  className,
}: {
  images: GalleryImage[];
  productName: string;
  className?: string;
}) {
  const ordered = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const active = ordered[activeIndex];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="bg-muted/40 border-border relative aspect-square overflow-hidden rounded-lg border">
        <Image
          key={active?.id ?? "placeholder"}
          src={active?.url || placeholderAssets.noImage}
          alt={productName}
          fill
          unoptimized={!!active}
          priority
          className="object-cover"
        />
      </div>

      {ordered.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {ordered.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "bg-muted/40 relative aspect-square overflow-hidden rounded-md border transition",
                index === activeIndex
                  ? "border-primary ring-primary/30 ring-2"
                  : "border-border hover:border-neutral",
              )}
            >
              <Image
                src={img.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
