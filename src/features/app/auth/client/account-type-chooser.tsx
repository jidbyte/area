"use client";

import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { ShoppingBag, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { chooseBuyerAccountType } from "@/features/app/auth/server/actions";

export function AccountTypeChooser() {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();

  function handleBuyer() {
    startTransition(async () => {
      const result = await chooseBuyerAccountType();
      if (result.success) {
        router.push(`/shop/${result.data.clerkUserId}`);
      }
    });
  }

  function handleBusiness() {
    router.push("/setup");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card
        role="button"
        aria-disabled={isPending}
        onClick={isPending ? undefined : handleBuyer}
        className="cursor-pointer transition-colors hover:border-primary"
      >
        <CardHeader className="items-center text-center">
          <ShoppingBag className="mb-2 size-8 text-primary" />
          <CardTitle>I'm here to shop</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-neutral">
          Browse and buy from stores on the platform. You can always start
          your own store later.
        </CardContent>
      </Card>

      <Card
        role="button"
        aria-disabled={isPending}
        onClick={isPending ? undefined : handleBusiness}
        className="cursor-pointer transition-colors hover:border-primary"
      >
        <CardHeader className="items-center text-center">
          <Store className="mb-2 size-8 text-primary" />
          <CardTitle>I'm setting up a store</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-neutral">
          Create your store, manage inventory, and start selling. You can
          still shop on other stores too.
        </CardContent>
      </Card>
    </div>
  );
}
