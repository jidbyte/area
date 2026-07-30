import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { resolveBuyerIdentity } from "@/features/cart/server/identity";
import { getCartItemCount } from "@/features/cart/server/queries";

export async function ShopHeader({
  shopId,
  slug,
  name,
  showSearch = false,
  initialQuery = "",
}: {
  shopId: string;
  slug: string;
  name: string;
  showSearch?: boolean;
  initialQuery?: string;
}) {
  const identity = await resolveBuyerIdentity();
  const itemCount = await getCartItemCount(shopId, identity);

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link href={`/${slug}`} className="text-lg font-semibold">
          {name}
        </Link>

        {showSearch && (
          <form action={`/${slug}`} className="min-w-0 flex-1 sm:max-w-xs">
            <Input
              type="search"
              name="q"
              placeholder="Search products..."
              defaultValue={initialQuery}
            />
          </form>
        )}

        <div className="flex items-center gap-3">
          <Link href={`/${slug}/cart`} className="relative">
            <Button variant="outline" size="icon" aria-label="Cart">
              <ShoppingCart />
            </Button>
            {itemCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          <Show when="signed-out">
            <SignInButton
              mode="modal"
              forceRedirectUrl={`/${slug}`}
              signUpForceRedirectUrl={`/${slug}`}
            >
              <Button size="sm">Login as buyer</Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
