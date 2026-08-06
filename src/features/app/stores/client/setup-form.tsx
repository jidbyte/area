"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CURRENCIES } from "@/shared/config/currencies";
import { setupSchema, type SetupInput } from "@/features/app/stores/server/schema";
import { completeSetup } from "@/features/app/stores/server/actions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function SetupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: { name: "", slug: "", currency: "USD" },
  });

  const onSubmit = (values: SetupInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await completeSetup(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(`/${result.data.slug}/dashboard`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Organization name
        </label>
        <Input
          id="name"
          placeholder="Happy Shop"
          {...register("name", {
            onChange: (e) => {
              if (!slugEdited) setValue("slug", slugify(e.target.value));
            },
          })}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          URL slug
        </label>
        <Input
          id="slug"
          placeholder="happy-shop"
          {...register("slug", {
            onChange: () => setSlugEdited(true),
          })}
        />
        {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
        <p className="text-muted-foreground text-xs">
          Your buyers will find you at /{watch("slug") || "your-slug"}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="currency" className="text-sm font-medium">
          Currency
        </label>
        <select
          id="currency"
          className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
          {...register("currency")}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.symbol})
            </option>
          ))}
        </select>
        {errors.currency && (
          <p className="text-destructive text-sm">{errors.currency.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          This is what your buyers will see next to every price.
        </p>
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
        {isPending ? "Setting up..." : "Finish setup"}
      </Button>
    </form>
  );
}
