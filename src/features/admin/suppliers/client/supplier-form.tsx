"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { supplierSchema, type SupplierInput } from "@/features/admin/suppliers/server/schema";
import { createSupplier, updateSupplier } from "@/features/admin/suppliers/server/actions";

export function SupplierForm({
  shopId,
  shopSlug,
  supplierId,
  defaultValues,
}: {
  shopId: string;
  shopSlug: string;
  supplierId?: string;
  defaultValues?: Partial<SupplierInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      ...defaultValues,
    },
  });

  const onSubmit = (values: SupplierInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = supplierId
        ? await updateSupplier(supplierId, values)
        : await createSupplier(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(`/${shopSlug}/suppliers`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="companyName" className="text-sm font-medium">
          Company name
        </label>
        <Input id="companyName" {...register("companyName")} />
        {errors.companyName && (
          <p className="text-destructive text-sm">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contactName" className="text-sm font-medium">
          Contact person
        </label>
        <Input id="contactName" {...register("contactName")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone
          </label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="website" className="text-sm font-medium">
          Website
        </label>
        <Input id="website" placeholder="https://" {...register("website")} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <Input id="address" {...register("address")} />
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending ? "Saving..." : supplierId ? "Save changes" : "Add supplier"}
      </Button>
    </form>
  );
}
