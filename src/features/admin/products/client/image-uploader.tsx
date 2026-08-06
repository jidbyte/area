"use client";

import { useState } from "react";
import { Images, Upload, X } from "lucide-react";
import { HiStar } from "react-icons/hi";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";

export type UploadedImage = {
  url: string;
  fileKey: string;
  isPrimary: boolean;
};

const MAX_IMAGES = 5;

export function ImageUploader({
  shopSlug,
  images,
  onChange,
}: {
  shopSlug: string;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = MAX_IMAGES - images.length;
  const isFull = remainingSlots <= 0;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const incoming = Array.from(files);
    const toUpload = incoming.slice(0, remainingSlots);
    const overflow = incoming.length - toUpload.length;

    setIsUploading(true);
    setError(
      overflow > 0
        ? `Only ${MAX_IMAGES} images allowed — ${overflow} file${overflow === 1 ? "" : "s"} skipped.`
        : null,
    );

    try {
      const uploaded: UploadedImage[] = [];
      for (const file of toUpload) {
        const res = await fetch("/api/uploads/r2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopSlug,
            fileName: file.name,
            contentType: file.type,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Upload failed");
        }
        const { uploadUrl, fileKey, publicUrl } = await res.json();

        let put: Response;
        try {
          put = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
        } catch {
          throw new Error(
            "Could not reach storage — the R2 bucket likely needs a CORS policy allowing PUT from this origin.",
          );
        }
        if (!put.ok)
          throw new Error(
            "Storage rejected the upload (check R2 credentials/bucket name).",
          );

        uploaded.push({ url: publicUrl, fileKey, isPrimary: false });
      }
      const next = [...images, ...uploaded];
      if (!next.some((i) => i.isPrimary) && next.length > 0)
        next[0].isPrimary = true;
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(fileKey: string) {
    const next = images.filter((i) => i.fileKey !== fileKey);
    if (next.length > 0 && !next.some((i) => i.isPrimary))
      next[0].isPrimary = true;
    onChange(next);
  }

  function makePrimary(fileKey: string) {
    onChange(images.map((i) => ({ ...i, isPrimary: i.fileKey === fileKey })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-neutral">
        <Images className="size-4 " />
        <span className="font-semibold md:text-lg">Images</span>
      </div>

      <label
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md border border-dashed text hover:bg-solid/10 p-4 md:p-6 hover:text-primary hover:border-primary",
          isFull || isUploading
            ? "cursor-not-allowed opacity-60 border-ink text-ink bg-muted/40"
            : "cursor-pointer border-neutral text-neutral",
        )}
      >
        <Upload className="size-6" />

        {isUploading
          ? "Uploading..."
          : isFull
            ? `Maximum ${MAX_IMAGES} images reached`
            : "Add image"}

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading || isFull}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {images.map((img) => (
            <div
              key={img.fileKey}
              className="group relative aspect-square overflow-hidden rounded-md border border-border"
            >
              <Image
                src={img.url}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img.fileKey)}
                className="absolute right-1 top-1 rounded-full bg-danger text-white p-1 opacity-0 group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
              {img.isPrimary ? (
                // <span className="absolute bottom-1 left-1 grid place-content-center size-6 rounded-full bg-warning text-black">
                //   <HiStar className="size-4" />
                // </span>

                <span className="absolute bottom-1 left-1 h-5 w-5 grid place-content-center bg-black/50 rounded-full">
                  <HiStar className="size-4 text-warning" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makePrimary(img.fileKey)}
                  className="absolute bottom-1 left-1 rounded bg-surface/80 px-1.5 py-0.5 text-[10px] border opacity-0 group-hover:opacity-100"
                >
                  Set primary
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {images.length === 0 && !error && (
        <p className="text-xs text-neutral">
          No images yet — the storefront will show the placeholder image.
        </p>
      )}
    </div>
  );
}
