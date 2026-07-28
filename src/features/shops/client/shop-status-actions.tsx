"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { approveShop, suspendShop } from "@/features/shops/server/actions";

export function ShopStatusActions({
  shopId,
  status,
}: {
  shopId: string;
  status: "pending" | "approved" | "suspended";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: (id: string) => Promise<{ success: boolean }>) => {
    startTransition(async () => {
      await action(shopId);
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button size="sm" disabled={isPending} onClick={() => run(approveShop)}>
          Approve
        </Button>
      )}
      {status !== "suspended" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(suspendShop)}
        >
          Suspend
        </Button>
      )}
    </div>
  );
}
