"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  updateSalePaymentInfo,
  cancelSale,
} from "@/features/admin/sales/server/actions";
import {
  CREATE_SALE_PAYMENT_STATUSES,
  type PaymentStatus,
} from "@/features/admin/sales/server/schema";

export function SalePaymentActions({
  saleId,
  paymentStatus,
  balance,
}: {
  saleId: string;
  paymentStatus: PaymentStatus;
  balance: number;
}) {
  const [status, setStatus] = useState<Exclude<PaymentStatus, "cancelled">>(
    paymentStatus === "cancelled" ? "pending" : paymentStatus,
  );
  const [balanceInput, setBalanceInput] = useState(balance);
  const [isPending, startTransition] = useActionTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const isCancelled = paymentStatus === "cancelled";

  function saveChanges() {
    setError(null);
    startTransition(async () => {
      const result = await updateSalePaymentInfo(saleId, status, balanceInput);
      if (!result.success) setError(result.error);
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelSale(saleId);
      if (!result.success) setError(result.error);
    });
  }

  if (isCancelled) {
    return (
      <p className="text-destructive text-sm font-medium">
        This sale has been cancelled.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">
            Payment status
          </label>
          <select
            className="border-input bg-transparent flex h-9 rounded-md border px-2 text-sm"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Exclude<PaymentStatus, "cancelled">)
            }
          >
            {CREATE_SALE_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {status !== "paid" && (
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">
              Balance owed
            </label>
            <Input
              type="number"
              step="1"
              className="w-32"
              value={balanceInput}
              onChange={(e) => setBalanceInput(Number(e.target.value))}
            />
          </div>
        )}
        <Button size="sm" disabled={isPending} loading={isPending} onClick={saveChanges}>
          Save
        </Button>
      </div>

      {!confirmingCancel ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending} loading={isPending}
          onClick={() => setConfirmingCancel(true)}
        >
          Cancel sale
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            This restores the sold stock back to inventory. Are you sure?
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending} loading={isPending}
              onClick={handleCancel}
            >
              {isPending ? "Cancelling..." : "Yes, cancel it"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmingCancel(false)}
            >
              Keep sale
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
