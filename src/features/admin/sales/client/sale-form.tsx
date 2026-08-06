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
  createSaleSchema,
  CREATE_SALE_PAYMENT_STATUSES,
  type CreateSaleInput,
} from "@/features/admin/sales/server/schema";
import { createSale } from "@/features/admin/sales/server/actions";

export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  code: string | null;
  sellingPrice: number;
};
export type CustomerOption = { id: string; name: string };

const emptyItem = {
  productId: "",
  productName: "",
  productCode: "",
  productSku: "",
  quantity: 1,
  unitPrice: 0,
};

export function SaleForm({
  shopId,
  shopSlug,
  products,
  customers,
}: {
  shopId: string;
  shopSlug: string;
  products: ProductOption[];
  customers: CustomerOption[];
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
  } = useForm<CreateSaleInput>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      customerId: "",
      customerName: "Walk-in customer",
      saleDate: new Date().toISOString().slice(0, 10),
      paymentStatus: "paid",
      balance: 0,
      discountAmount: 0,
      items: [emptyItem],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const discountAmount = Number(watch("discountAmount")) || 0;
  const paymentStatus = watch("paymentStatus");
  const itemsTotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const total = Math.max(0, itemsTotal - discountAmount);

  function handleProductSelect(index: number, productId: string) {
    setValue(`items.${index}.productId`, productId);
    const found = products.find((p) => p.id === productId);
    if (found) {
      setValue(`items.${index}.productName`, found.name);
      setValue(`items.${index}.productSku`, found.sku);
      setValue(`items.${index}.productCode`, found.code ?? "");
      setValue(`items.${index}.unitPrice`, found.sellingPrice);
    }
  }

  function handleCustomerSelect(customerId: string) {
    setValue("customerId", customerId);
    const found = customers.find((c) => c.id === customerId);
    if (found) setValue("customerName", found.name);
  }

  const onSubmit = (values: CreateSaleInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createSale(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(`/${shopSlug}/transactions/sales/${result.data.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="customerId" className="text-sm font-medium">
            Customer
          </label>
          <select
            id="customerId"
            className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 text-sm shadow-xs"
            value={watch("customerId") || ""}
            onChange={(e) => handleCustomerSelect(e.target.value)}
          >
            <option value="">— Walk-in / not in customer list —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customerName" className="text-sm font-medium">
            Customer name
          </label>
          <Input id="customerName" {...register("customerName")} />
          {errors.customerName && (
            <p className="text-destructive text-sm">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="saleDate" className="text-sm font-medium">
            Sale date
          </label>
          <Input id="saleDate" type="date" {...register("saleDate")} />
          {errors.saleDate && (
            <p className="text-destructive text-sm">
              {errors.saleDate.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="paymentStatus" className="text-sm font-medium">
            Payment status
          </label>
          <select
            id="paymentStatus"
            className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 text-sm shadow-xs"
            {...register("paymentStatus")}
          >
            {CREATE_SALE_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {paymentStatus !== "paid" && (
          <div className="space-y-1.5">
            <label htmlFor="balance" className="text-sm font-medium">
              Balance owed
            </label>
            <Input
              id="balance"
              type="number"
              step="1"
              {...register("balance", { valueAsNumber: true })}
            />
          </div>
        )}
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
                <label className="text-muted-foreground text-xs">Price</label>
                <Input
                  type="number"
                  step="1"
                  {...register(`items.${index}.unitPrice`, {
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
        {isPending ? "Saving..." : "Record sale"}
      </Button>
    </form>
  );
}
