import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export function ShopHeader({
  slug,
  name,
  showSearch = false,
  initialQuery = "",
}: {
  slug: string;
  name: string;
  showSearch?: boolean;
  initialQuery?: string;
}) {
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
          {/* Cart logic arrives in the Cart phase — placeholder for now. */}
          <Button variant="outline" size="icon" aria-label="Cart" disabled>
            <ShoppingCart />
          </Button>

          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl={`/${slug}`} signUpForceRedirectUrl={`/${slug}`}>
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
