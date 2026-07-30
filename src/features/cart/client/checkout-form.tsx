"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatPrice } from "@/shared/utils/currency";
import {
  checkoutSchema,
  type CheckoutInput,
} from "@/features/cart/server/schema";
import { placeOrder } from "../server/actions";

export type CheckoutLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function CheckoutForm({
  shopId,
  shopSlug,
  currency,
  items,
  subtotal,
}: {
  shopId: string;
  shopSlug: string;
  currency: string;
  items: CheckoutLineItem[];
  subtotal: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", email: "", phone: "", address: "" },
  });

  const onSubmit = (values: CheckoutInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await placeOrder(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(`/${shopSlug}/order/${result.data.saleId}`);
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Full name
          </label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
          <p className="text-muted-foreground text-xs">
            We&apos;ll send your order confirmation here.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone
          </label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="address" className="text-sm font-medium">
            Delivery address
          </label>
          <Input id="address" {...register("address")} />
          {errors.address && (
            <p className="text-destructive text-sm">{errors.address.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Placing order..." : "Place order"}
        </Button>
      </form>

      <div className="h-fit space-y-2 rounded-md border p-4">
        <h2 className="font-medium">Order summary</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatPrice(item.quantity * item.price, currency)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        <p className="text-muted-foreground text-xs">
          Payment is collected offline for now — online payment is coming soon.
        </p>
      </div>
    </div>
  );
}
