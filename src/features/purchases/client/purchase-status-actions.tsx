"use client";

import { useState, useTransition } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  updatePurchaseStatus,
  updatePurchasePaymentStatus,
} from "@/features/purchases/server/actions";
import {
  PAYMENT_STATUSES,
  type PurchaseStatus,
  type PaymentStatus,
} from "@/features/purchases/server/schema";

const NEXT_STATUS: Partial<Record<PurchaseStatus, PurchaseStatus>> = {
  draft: "ordered",
  ordered: "shipped",
  shipped: "received",
};

const NEXT_LABEL: Partial<Record<PurchaseStatus, string>> = {
  draft: "Mark as ordered",
  ordered: "Mark as shipped",
  shipped: "Mark as received",
};

export function PurchaseStatusActions({
  purchaseId,
  purchaseStatus,
  paymentStatus,
}: {
  purchaseId: string;
  purchaseStatus: PurchaseStatus;
  paymentStatus: PaymentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isFinal =
    purchaseStatus === "received" || purchaseStatus === "cancelled";
  const next = NEXT_STATUS[purchaseStatus];

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {next && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => updatePurchaseStatus(purchaseId, next))}
          >
            {NEXT_LABEL[purchaseStatus]}
          </Button>
        )}
        {!isFinal && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => updatePurchaseStatus(purchaseId, "cancelled"))
            }
          >
            Cancel order
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="paymentStatus"
          className="text-muted-foreground text-sm"
        >
          Payment status
        </label>
        <select
          id="paymentStatus"
          className="border-input bg-transparent flex h-8 rounded-md border px-2 text-sm"
          defaultValue={paymentStatus}
          disabled={isPending}
          onChange={(e) =>
            run(() =>
              updatePurchasePaymentStatus(
                purchaseId,
                e.target.value as PaymentStatus,
              ),
            )
          }
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
