"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Sparkles, PackagePlus, Info, Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  PageHeader,
  PageTitle,
  PageAction,
} from "@/shared/components/common/page-header";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/features/admin/products/server/schema";
import {
  createProduct,
  updateProduct,
} from "@/features/admin/products/server/actions";
import { generateProductDescription } from "@/features/admin/products/server/ai";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { cn } from "@/shared/lib/utils";
import { Message } from "@/shared/components/common/message";
import { FormField } from "@/shared/components/common/form-field";
import { Separator } from "@/shared/components/ui/separator";
import { CategorySelector } from "./category-selector";

const DESCRIPTION_MAX = 500;

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
  const [isPending, startTransition] = useActionTransition();
  const [isGenerating, startGenerating] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>(
    (defaultValues?.images as UploadedImage[] | undefined) ?? [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      brand: "",
      model: "",
      description: "",
      sellingPrice: 0,
      costPrice: 0,
      quantity: 0,
      restockLevel: 10,
      categories: [],
      images: [],
      ...defaultValues,
    },
  });

  const description = watch("description") ?? "";
  const name = watch("name");
  const brand = watch("brand");
  const model = watch("model");
  const categories = watch("categories") ?? [];
  const sellingPrice = watch("sellingPrice");

  const handleGenerateDescription = () => {
    if (!name?.trim()) {
      toast.error("Add a product name first so AI has something to work with.");
      return;
    }

    startGenerating(async () => {
      const result = await generateProductDescription({
        name,
        brand,
        model,
        categories,
        sellingPrice,
        currency,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setValue("description", result.description, { shouldValidate: true });
      toast.success("Description generated");
    });
  };

  const onSubmit = (values: CreateProductInput) => {
    setServerError(null);
    const payload = { ...values, images };

    startTransition(async () => {
      const result = productId
        ? await updateProduct(productId, payload)
        : await createProduct(shopId, payload);

      if (!result.success) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(productId ? "Product updated" : "Product created");
      router.push(
        productId ? `/${shopSlug}/products/${productId}` : `/${shopSlug}/products`,
      );
      router.refresh();
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl">
        <PageHeader>
          <PageTitle icon={PackagePlus}>
            {productId ? "Edit product" : "Add new product"}
          </PageTitle>

          <PageAction className="hidden md:flex gap-2">
            <Button
              variant="secondary"
              shape="round"
              type="submit"
              disabled={isPending} loading={isPending}
            >
              {isPending ? "Saving..." : productId ? "Save changes" : "Confirm"}
            </Button>

            <Button
              type="button"
              variant="outline"
              shape="round"
              onClick={() =>
                router.push(
                  productId
                    ? `/${shopSlug}/products/${productId}`
                    : `/${shopSlug}/products`,
                )
              }
            >
              Cancel
            </Button>
          </PageAction>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 mt-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
          <section className="border rounded-md p-4 lg:p-6">
            <div className="flex items-center gap-2 text-neutral">
              <Info className="size-4 " />
              <span className="font-semibold md:text-lg">Details</span>
            </div>

            {serverError && <Message variant="error">{serverError}</Message>}

            <div className="space-y-2">
              <FormField
                label="Name"
                htmlFor="name"
                required
                error={errors.name?.message}
              >
                <Input id="name" {...register("name")} />
              </FormField>

              <FormField
                label="Description"
                htmlFor="description"
                required
                error={errors.description?.message}
              >
                <Textarea
                  id="description"
                  rows={4}
                  maxLength={DESCRIPTION_MAX}
                  className="mt-0.5"
                  {...register("description")}
                />

                <div className="mt-1 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="text-xs font-semibold flex items-center gap-1 text-success cursor-pointer"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Crafting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 underline hover:text-neutral">
                        <Sparkles className="size-3" /> Generate with AI
                      </span>
                    )}
                  </button>

                  <span
                    className={cn(
                      "text-xs tabular-nums text-neutral",
                      description.length >= DESCRIPTION_MAX && "text-warning",
                    )}
                  >
                    {description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
              </FormField>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <FormField
                label="SKU"
                htmlFor="sku"
                required
                error={errors.sku?.message}
              >
                <Input id="sku" {...register("sku")} />
              </FormField>

              <FormField label="Code" htmlFor="code">
                <Input id="code" {...register("code" as never)} />
              </FormField>

              <FormField label="Brand" htmlFor="brand">
                <Input id="brand" {...register("brand")} />
              </FormField>

              <FormField label="Model" htmlFor="model">
                <Input id="model" {...register("model")} />
              </FormField>
            </div>

            <Separator className="mt-6 mb-4" />

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <FormField
                  label="Cost price"
                  htmlFor="costPrice"
                  error={errors.costPrice?.message}
                >
                  <Input
                    id="costPrice"
                    type="number"
                    step="1"
                    {...register("costPrice", { valueAsNumber: true })}
                  />
                </FormField>

                <FormField
                  label="Selling price"
                  htmlFor="sellingPrice"
                  error={errors.sellingPrice?.message}
                >
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="1"
                    {...register("sellingPrice", { valueAsNumber: true })}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <FormField
                  label="Qty in stock"
                  htmlFor="quantity"
                  error={errors.quantity?.message}
                >
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                </FormField>

                <FormField label="Restock level" htmlFor="restockLevel">
                  <Input
                    id="restockLevel"
                    type="number"
                    step="1"
                    {...register("restockLevel", { valueAsNumber: true })}
                  />
                </FormField>
              </div>
            </div>
          </section>

          <div className="space-y-4 lg:space-y-6">
            <section className="border rounded-md p-4 lg:p-6">
              <ImageUploader
                shopSlug={shopSlug}
                images={images}
                onChange={setImages}
              />
            </section>

            <section className="border rounded-md p-4 lg:p-6">
              <CategorySelector
                value={categories}
                onChange={(next) =>
                  setValue("categories", next, { shouldValidate: true })
                }
              />
            </section>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4 mb-8 gap-2 md:hidden">
          <Button
            variant="secondary"
            shape="round"
            type="submit"
            disabled={isPending} loading={isPending}
          >
            {isPending ? "Saving..." : productId ? "Save changes" : "Confirm"}
          </Button>

          <Button
            type="button"
            variant="outline"
            shape="round"
            onClick={() =>
              router.push(
                productId ? `/${shopSlug}/products/${productId}` : `/${shopSlug}/products`,
              )
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
