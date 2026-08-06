"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  createPurchaseSchema,
  type CreatePurchaseInput,
} from "@/features/admin/purchases/server/schema";
import {
  createPurchase,
  updatePurchase,
} from "@/features/admin/purchases/server/actions";

export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  code: string | null;
  costPrice: number;
};
export type SupplierOption = { id: string; companyName: string };

const emptyItem = {
  productId: "",
  productName: "",
  productCode: "",
  productSku: "",
  quantity: 1,
  unitCost: 0,
};

export function PurchaseForm({
  shopId,
  shopSlug,
  purchaseId,
  products,
  suppliers,
  defaultValues,
}: {
  shopId: string;
  shopSlug: string;
  purchaseId?: string;
  products: ProductOption[];
  suppliers: SupplierOption[];
  defaultValues?: Partial<CreatePurchaseInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: {
      supplierId: "",
      supplierName: "",
      purchaseDate: new Date().toISOString().slice(0, 10),
      eta: "",
      shippingCost: 0,
      discountAmount: 0,
      items: [emptyItem],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const shippingCost = Number(watch("shippingCost")) || 0;
  const discountAmount = Number(watch("discountAmount")) || 0;
  const itemsTotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0,
  );
  const total = Math.max(0, itemsTotal + shippingCost - discountAmount);

  function handleProductSelect(index: number, productId: string) {
    setValue(`items.${index}.productId`, productId);
    const found = products.find((p) => p.id === productId);
    if (found) {
      setValue(`items.${index}.productName`, found.name);
      setValue(`items.${index}.productSku`, found.sku);
      setValue(`items.${index}.productCode`, found.code ?? "");
      setValue(`items.${index}.unitCost`, found.costPrice);
    }
  }

  const onSubmit = (values: CreatePurchaseInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = purchaseId
        ? await updatePurchase(purchaseId, values)
        : await createPurchase(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(
        purchaseId ? `/${shopSlug}/transactions/purchases/${purchaseId}` : `/${shopSlug}/transactions/purchases`,
      );
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="supplierId" className="text-sm font-medium">
            Supplier
          </label>
          <select
            id="supplierId"
            className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 text-sm shadow-xs"
            {...register("supplierId", {
              onChange: (e) => {
                const found = suppliers.find((s) => s.id === e.target.value);
                if (found) setValue("supplierName", found.companyName);
              },
            })}
          >
            <option value="">— Not in supplier list —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="supplierName" className="text-sm font-medium">
            Supplier name
          </label>
          <Input id="supplierName" {...register("supplierName")} />
          {errors.supplierName && (
            <p className="text-destructive text-sm">
              {errors.supplierName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="purchaseDate" className="text-sm font-medium">
            Order date
          </label>
          <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
          {errors.purchaseDate && (
            <p className="text-destructive text-sm">
              {errors.purchaseDate.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="eta" className="text-sm font-medium">
            Expected delivery (optional)
          </label>
          <Input id="eta" type="date" {...register("eta")} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Items</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append(emptyItem)}
          >
            Add item
          </Button>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4 space-y-1">
                <label className="text-muted-foreground text-xs">Product</label>
                <select
                  className="border-input bg-transparent flex h-9 w-full rounded-md border px-2 text-sm"
                  value={watch(`items.${index}.productId`) || ""}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                >
                  <option value="">— Custom item —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-muted-foreground text-xs">Name</label>
                <Input {...register(`items.${index}.productName`)} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-muted-foreground text-xs">SKU</label>
                <Input {...register(`items.${index}.productSku`)} />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-muted-foreground text-xs">Qty</label>
                <Input
                  type="number"
                  step="1"
                  {...register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-muted-foreground text-xs">Cost</label>
                <Input
                  type="number"
                  step="1"
                  {...register(`items.${index}.unitCost`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label="Remove item"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-auto grid max-w-sm grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="shippingCost" className="text-sm font-medium">
            Shipping
          </label>
          <Input
            id="shippingCost"
            type="number"
            step="1"
            {...register("shippingCost", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="discountAmount" className="text-sm font-medium">
            Discount
          </label>
          <Input
            id="discountAmount"
            type="number"
            step="1"
            {...register("discountAmount", { valueAsNumber: true })}
          />
        </div>
        <div className="col-span-2 flex items-center justify-between border-t pt-2 text-sm font-semibold">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending
          ? "Saving..."
          : purchaseId
            ? "Save changes"
            : "Create purchase order"}
      </Button>
    </form>
  );
}
