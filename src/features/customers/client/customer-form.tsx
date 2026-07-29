"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { customerSchema, type CustomerInput } from "@/features/customers/server/schema";
import { createCustomer, updateCustomer } from "@/features/customers/server/actions";

export function CustomerForm({
  shopId,
  customerId,
  defaultValues,
}: {
  shopId: string;
  customerId?: string;
  defaultValues?: Partial<CustomerInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      customerType: "individual",
      email: "",
      phone: "",
      address: "",
      ...defaultValues,
    },
  });

  const onSubmit = (values: CustomerInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = customerId
        ? await updateCustomer(customerId, values)
        : await createCustomer(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/customers");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="customerType" className="text-sm font-medium">
          Type
        </label>
        <select
          id="customerType"
          className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 text-sm shadow-xs"
          {...register("customerType")}
        >
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </select>
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
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <Input id="address" {...register("address")} />
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : customerId ? "Save changes" : "Add customer"}
      </Button>
    </form>
  );
}
