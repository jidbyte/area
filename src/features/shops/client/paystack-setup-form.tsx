"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  paystackSetupSchema,
  type PaystackSetupInput,
} from "@/features/shops/server/schema";
import { setupPaystackSubaccount } from "@/features/shops/server/actions";

export type BankOption = { name: string; code: string };

export function PaystackSetupForm({
  banks,
  isConnected,
  commissionPercent,
}: {
  banks: BankOption[];
  isConnected: boolean;
  commissionPercent: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaystackSetupInput>({
    resolver: zodResolver(paystackSetupSchema),
    defaultValues: { bankCode: "", accountNumber: "" },
  });

  const onSubmit = (values: PaystackSetupInput) => {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setupPaystackSubaccount(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        AREA takes a {commissionPercent}% commission per sale (this covers
        Paystack&apos;s own processing fee — our actual margin is a fraction of
        that). The rest settles directly to the bank account below.
      </p>

      {isConnected && (
        <p className="text-sm font-medium text-green-600">
          Payments are connected.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="bankCode" className="text-sm font-medium">
            Settlement bank
          </label>
          <select
            id="bankCode"
            className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 text-sm shadow-xs"
            {...register("bankCode")}
          >
            <option value="">Select a bank</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.bankCode && (
            <p className="text-destructive text-sm">
              {errors.bankCode.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="accountNumber" className="text-sm font-medium">
            Account number
          </label>
          <Input id="accountNumber" {...register("accountNumber")} />
          {errors.accountNumber && (
            <p className="text-destructive text-sm">
              {errors.accountNumber.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}
        {saved && !serverError && (
          <p className="text-sm text-green-600">Saved.</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : isConnected
              ? "Update bank details"
              : "Connect payments"}
        </Button>
      </form>
    </div>
  );
}
