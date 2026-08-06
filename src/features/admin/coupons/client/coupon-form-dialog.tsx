"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { FormField } from "@/shared/components/common/form-field";
import { couponSchema, type CouponInput } from "@/features/admin/coupons/server/schema";
import { createCoupon, updateCoupon } from "@/features/admin/coupons/server/actions";

export function CouponFormDialog({
  shopId,
  couponId,
  trigger,
  defaultValues,
}: {
  shopId: string;
  couponId?: string;
  trigger?: React.ReactNode;
  defaultValues?: Partial<CouponInput>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderAmount: 0,
      maxRedemptions: undefined,
      startsAt: "",
      expiresAt: "",
      isActive: true,
      ...defaultValues,
    },
  });

  const discountType = watch("discountType");

  const onSubmit = (values: CouponInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = couponId
        ? await updateCoupon(couponId, values)
        : await createCoupon(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button shape="round">
            <Plus className="size-4" /> Add coupon
          </Button>
        )}
      </DialogTrigger>

      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{couponId ? "Edit coupon" : "Add coupon"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Code" htmlFor="code" error={errors.code?.message}>
            <Input id="code" placeholder="e.g. WELCOME10" {...register("code")} className="uppercase" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Discount type" htmlFor="discountType">
              <select
                id="discountType"
                className="h-9 w-full rounded-md border border-muted/40 bg-surface px-3 text-sm text-ink"
                {...register("discountType")}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </FormField>

            <FormField
              label={discountType === "percentage" ? "Discount (%)" : "Discount amount"}
              htmlFor="discountValue"
              error={errors.discountValue?.message}
            >
              <Input
                id="discountValue"
                type="number"
                step="1"
                {...register("discountValue", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField label="Minimum order amount (optional)" htmlFor="minOrderAmount">
            <Input
              id="minOrderAmount"
              type="number"
              step="1"
              {...register("minOrderAmount", { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Max redemptions (optional — leave blank for unlimited)" htmlFor="maxRedemptions">
            <Input
              id="maxRedemptions"
              type="number"
              step="1"
              {...register("maxRedemptions", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Starts (optional)" htmlFor="startsAt">
              <Input id="startsAt" type="date" {...register("startsAt")} />
            </FormField>
            <FormField label="Expires (optional)" htmlFor="expiresAt">
              <Input id="expiresAt" type="date" {...register("expiresAt")} />
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <label htmlFor="isActive" className="text-sm text-ink">
              Active
            </label>
          </div>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
            {isPending ? "Saving..." : couponId ? "Save changes" : "Add coupon"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
