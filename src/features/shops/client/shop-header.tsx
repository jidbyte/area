import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import { resolveBuyerIdentity } from "@/features/cart/server/identity";
import { getCartItemCount } from "@/features/cart/server/queries";
import { ShopHeaderSearch } from "./shop-header-search";
import { ThemeToggle } from "@/shared/components/theme/theme-toggle";

const NAV_LINKS = [
  { label: "Home", href: "/" },
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
          href={`/${slug}`}
          className="text-lg uppercase md:text-2xl font-bold tracking-tighter"
        >
          {name}
        </Link>

        <nav className="hidden items-center justify-center gap-8 font-medium md:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={`/${slug}${item.href}`}
              className="transition-colors hover:text-primary hover:font-bold tracking-wider"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="block md:hidden">
          <Link href={`/${slug}/cart`}>
            <Button
              className="bg-green-600 hover:bg-green-700 px-5 text-white"
              aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
            >
              <span className="relative inline-flex">
                <ShoppingCart className="size-5" />

                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-black text-white text-[9px] font-medium">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>

              <span>Cart</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden md:block mr-4">
            <Link href={`/${slug}/cart`}>
              <Button
                className="bg-green-600 hover:bg-green-700 px-5 text-white"
                aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
              >
                <span className="relative inline-flex">
                  <ShoppingCart className="size-5" />

                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-black text-white text-[9px] font-medium">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
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
              forceRedirectUrl={`/${slug}`}
              signUpForceRedirectUrl={`/${slug}`}
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
