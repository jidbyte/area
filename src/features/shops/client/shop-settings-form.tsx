"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  shopSettingsSchema,
  type ShopSettingsInput,
} from "@/features/shops/server/schema";
import { updateShopSettings } from "@/features/shops/server/actions";

export function ShopSettingsForm({
  defaultValues,
}: {
  defaultValues: ShopSettingsInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShopSettingsInput>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues,
  });

  const nameLength = watch("name")?.length ?? 0;

  const onSubmit = (values: ShopSettingsInput) => {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateShopSettings(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="name" className="text-sm font-medium">
            Shop name
          </label>
          <span className="text-muted-foreground text-xs">{nameLength}/80</span>
        </div>
        <Input id="name" maxLength={80} {...register("name")} />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className="border-input bg-transparent flex w-full rounded-md border px-3 py-2 text-sm shadow-xs"
          placeholder="What does your shop sell? What makes it worth a look?"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <Input
          id="address"
          placeholder="123 Main St, Accra"
          {...register("address")}
        />
        {errors.address && (
          <p className="text-destructive text-sm">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Contact email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            Contact phone
          </label>
          <Input
            id="phone"
            placeholder="+233 20 123 4567"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      {saved && !serverError && (
        <p className="text-sm text-green-600">Saved.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
