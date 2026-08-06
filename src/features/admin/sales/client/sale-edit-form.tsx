"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  updateSaleSchema,
  type UpdateSaleInput,
} from "@/features/admin/sales/server/schema";
import { updateSale } from "@/features/admin/sales/server/actions";
import type { CustomerOption } from "./sale-form";

export function SaleEditForm({
  saleId,
  shopSlug,
  customers,
  defaultValues,
}: {
  saleId: string;
  shopSlug: string;
  customers: CustomerOption[];
  defaultValues: UpdateSaleInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateSaleInput>({
    resolver: zodResolver(updateSaleSchema),
    defaultValues,
  });

  function handleCustomerSelect(customerId: string) {
    setValue("customerId", customerId);
    const found = customers.find((c) => c.id === customerId);
    if (found) setValue("customerName", found.name);
  }

  const onSubmit = (values: UpdateSaleInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateSale(saleId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(`/${shopSlug}/transactions/sales/${saleId}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
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
          <p className="text-destructive text-sm">{errors.saleDate.message}</p>
        )}
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

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
