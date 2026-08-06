"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatPrice } from "@/shared/utils/currency";
import { deleteCoupon } from "@/features/admin/coupons/server/actions";
import { CouponFormDialog } from "./coupon-form-dialog";

export type CouponRow = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
};

export function CouponsTable({
  shopId,
  currency,
  coupons,
}: {
  shopId: string;
  currency: string;
  coupons: CouponRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await deleteCoupon(id);
      router.refresh();
    });
  }

  if (coupons.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral">No coupons yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Redemptions</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {coupons.map((c) => {
          const expired = c.expiresAt && c.expiresAt < new Date();
          return (
            <TableRow key={c.id}>
              <TableCell className="font-mono font-medium">{c.code}</TableCell>
              <TableCell>
                {c.discountType === "percentage"
                  ? `${c.discountValue}%`
                  : formatPrice(c.discountValue, currency)}
                {c.minOrderAmount > 0 && (
                  <span className="ml-1 text-xs text-neutral">
                    (min {formatPrice(c.minOrderAmount, currency)})
                  </span>
                )}
              </TableCell>
              <TableCell>
                {c.redemptionCount}
                {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
              </TableCell>
              <TableCell>
                {!c.isActive ? (
                  <span className="text-neutral">Inactive</span>
                ) : expired ? (
                  <span className="text-danger">Expired</span>
                ) : (
                  <span className="text-success">Active</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <CouponFormDialog
                    shopId={shopId}
                    couponId={c.id}
                    defaultValues={{
                      code: c.code,
                      discountType: c.discountType,
                      discountValue: c.discountValue,
                      minOrderAmount: c.minOrderAmount,
                      maxRedemptions: c.maxRedemptions,
                      startsAt: c.startsAt ? c.startsAt.toISOString().slice(0, 10) : "",
                      expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : "",
                      isActive: c.isActive,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending && pendingId === c.id} loading={isPending && pendingId === c.id}
                    onClick={() => handleDelete(c.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
