"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

export type UploadedImage = {
  url: string;
  fileKey: string;
  isPrimary: boolean;
};

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

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return;
  setIsUploading(true);
  setError(null);
  try {
    const uploaded: UploadedImage[] = [];
    for (const file of Array.from(files)) {
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
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {images.map((img) => (
          <div
            key={img.fileKey}
            className="group relative aspect-square overflow-hidden rounded-md border"
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
              className="bg-background/80 absolute top-1 right-1 rounded-full p-1 opacity-0 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
            {img.isPrimary ? (
              <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px]">
                Primary
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makePrimary(img.fileKey)}
                className="bg-background/80 absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100"
              >
                Set primary
              </button>
            )}
          </div>
        ))}

        <label className="text-muted-foreground hover:bg-accent flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs">
          <Upload className="size-4" />
          {isUploading ? "Uploading..." : "Add image"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={isUploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {images.length === 0 && !error && (
        <p className="text-muted-foreground text-xs">
          No images yet — the storefront will show the placeholder image.
        </p>
      )}
    </div>
  );
}
