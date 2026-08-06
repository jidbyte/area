"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";

import { Button } from "@/shared/components/ui/button";
import { deleteShop } from "@/features/app/stores/server/actions";

export function DeleteShopButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useActionTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        Delete shop
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        This permanently deletes your shop and its organization. Are you sure?
      </p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending} loading={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteShop();
              if (result && !result.success) setError(result.error);
            })
          }
        >
          {isPending ? "Deleting..." : "Yes, delete it"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
