"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createShopSchema, type CreateShopInput } from "@/features/shops/server/schema";
import { createShop } from "@/features/shops/server/actions";

export function ShopOnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateShopInput>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      address: "",
      email: "",
      contact: "",
    },
  });

  const onSubmit = (values: CreateShopInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createShop(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(`/${result.data.slug}/admin`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Shop name
        </label>
        <Input id="name" placeholder="Happy Shop" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          URL slug
        </label>
        <Input id="slug" placeholder="happy-shop" {...register("slug")} />
        {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
        <p className="text-muted-foreground text-xs">Your shop will live at /{"{slug}"}/shop</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Input id="description" {...register("description")} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Contact email
        </label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create shop"}
      </Button>
    </form>
  );
}
