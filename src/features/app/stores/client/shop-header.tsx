import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import { resolveBuyerIdentity } from "@/features/app/payments/server/identity";
import { getCartItemCount } from "@/features/app/payments/server/cart-queries";
import { ShopHeaderSearch } from "./shop-header-search";
import { CartBadgeCount } from "@/features/app/payments/client/cart-badge-count";
import { ThemeToggle } from "@/shared/components/app/theme-toggle";

// "Home" is this store's own storefront; Shop/Contact are platform-wide
// pages, not store-scoped — matches the nav spec (home, shop, contact).
const GLOBAL_NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
];

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
    <header className="border-b flex items-center gap-8 p-4 md:px-12">
      <div className="flex items-center w-full justify-between gap-4">
        <Link
          href={`/stores/${slug}`}
          className="text-lg uppercase md:text-2xl font-bold tracking-tighter"
        >
          {name}
        </Link>

        <nav className="hidden items-center justify-center gap-8 font-medium md:flex">
          <Link
            href={`/stores/${slug}`}
            className="transition-colors hover:text-primary hover:font-bold tracking-wider"
          >
            Home
          </Link>
          {GLOBAL_NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-primary hover:font-bold tracking-wider"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="block md:hidden">
          <Link href={`/stores/${slug}/cart`}>
            <Button
              className="bg-green-600 hover:bg-green-700 px-5 text-white"
              aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
            >
              <span className="relative inline-flex">
                <ShoppingCart className="size-5" />

                <CartBadgeCount shopId={shopId} initialCount={itemCount} />
              </span>

              <span>Cart</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden md:block mr-4">
            <Link href={`/stores/${slug}/cart`}>
              <Button
                className="bg-green-600 hover:bg-green-700 px-5 text-white"
                aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
              >
                <span className="relative inline-flex">
                  <ShoppingCart className="size-5" />

                  <CartBadgeCount shopId={shopId} initialCount={itemCount} />
                </span>

                <span>Cart</span>
              </Button>
            </Link>
          </div>

          <ThemeToggle />

          {showSearch && (
            <ShopHeaderSearch slug={slug} initialQuery={initialQuery} />
          )}

          <Show when="signed-out">
            <SignInButton
              mode="modal"
              forceRedirectUrl={`/stores/${slug}`}
              signUpForceRedirectUrl={`/stores/${slug}`}
            >
              <Button shape="round">Login</Button>
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
