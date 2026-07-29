"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/features/inventory/server/schema";
import {
  createProduct,
  updateProduct,
} from "@/features/inventory/server/actions";
import { ImageUploader, type UploadedImage } from "./image-uploader";

export function ProductForm({
  shopId,
  shopSlug,
  currency,
  productId,
  defaultValues,
}: {
  shopId: string;
  shopSlug: string;
  currency: string;
  productId?: string;
  defaultValues?: Partial<CreateProductInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>(
    (defaultValues?.images as UploadedImage[] | undefined) ?? [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      brand: "",
      model: "",
      description: "",
      price: 0,
      cost: 0,
      quantity: 0,
      restockLevel: 0,
      optimalLevel: 0,
      categories: [],
      images: [],
      ...defaultValues,
    },
  });

  const onSubmit = (values: CreateProductInput) => {
    setServerError(null);
    const payload = { ...values, images };
    startTransition(async () => {
      const result = productId
        ? await updateProduct(productId, payload)
        : await createProduct(shopId, payload);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Product images</label>
          <ImageUploader
            shopSlug={shopSlug}
            images={images}
            onChange={setImages}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sku" className="text-sm font-medium">
            SKU
          </label>
          <Input id="sku" {...register("sku")} />
          {errors.sku && (
            <p className="text-destructive text-sm">{errors.sku.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="brand" className="text-sm font-medium">
            Brand
          </label>
          <Input id="brand" {...register("brand")} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="model" className="text-sm font-medium">
            Model
          </label>
          <Input id="model" {...register("model")} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Input id="description" {...register("description")} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <label htmlFor="categories" className="text-sm font-medium">
            Categories
          </label>
          <Input
            id="categories"
            placeholder="Comma-separated, e.g. Speakers, Audio"
            defaultValue={(defaultValues?.categories ?? []).join(", ")}
            onChange={(e) =>
              setValue(
                "categories",
                e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="price" className="text-sm font-medium">
            Price ({currency})
          </label>
          <Input
            id="price"
            type="number"
            step="1"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-destructive text-sm">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cost" className="text-sm font-medium">
            Cost ({currency})
          </label>
          <Input
            id="cost"
            type="number"
            step="1"
            {...register("cost", { valueAsNumber: true })}
          />
          {errors.cost && (
            <p className="text-destructive text-sm">{errors.cost.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="quantity" className="text-sm font-medium">
            Quantity in stock
          </label>
          <Input
            id="quantity"
            type="number"
            step="1"
            {...register("quantity", { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-destructive text-sm">
              {errors.quantity.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="restockLevel" className="text-sm font-medium">
            Restock level
          </label>
          <Input
            id="restockLevel"
            type="number"
            step="1"
            {...register("restockLevel", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="optimalLevel" className="text-sm font-medium">
            Optimal level
          </label>
          <Input
            id="optimalLevel"
            type="number"
            step="1"
            {...register("optimalLevel", { valueAsNumber: true })}
          />
        </div>
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Saving..."
          : productId
            ? "Save changes"
            : "Create product"}
      </Button>
    </form>
  );
}
