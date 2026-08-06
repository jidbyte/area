"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { ThemeToggle } from "@/shared/components/app/theme-toggle";
import { Logo } from "@/shared/components/app/logo";
import { GlobalSearchDialog } from "@/features/app/catalog/client/global-search-dialog";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
];

// Cart here is a browse-and-buy entry point rather than a live item count —
// each store runs its own single-vendor cart/checkout (see
// features/cart), so there's no cross-store cart to summarize at the
// platform level. This links into the shop catalog, where a person picks a
// store and its own cart takes over from there.
export function GlobalNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-muted/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          <Logo height={24} />
        </Link>

        <nav className="hidden items-center gap-8 font-medium md:flex">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <GlobalSearchDialog />
          </div>

          <Button asChild variant="ghost" size="icon" aria-label="Shop">
            <Link href="/shop">
              <ShoppingBag className="size-5" />
            </Link>
          </Button>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/onboarding" signUpForceRedirectUrl="/onboarding">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/onboarding" signInForceRedirectUrl="/onboarding">
                <Button size="sm">Sign up</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>

          <div className="block md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-3/4">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4 pb-4">
                  {NAV_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2 font-medium text-solid hover:bg-solid/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-4 flex flex-col gap-2 px-4">
                  <Show when="signed-out">
                    <SignInButton mode="modal" forceRedirectUrl="/onboarding" signUpForceRedirectUrl="/onboarding">
                      <Button variant="outline">Sign in</Button>
                    </SignInButton>
                    <SignUpButton mode="modal" forceRedirectUrl="/onboarding" signInForceRedirectUrl="/onboarding">
                      <Button>Sign up</Button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <div className="flex items-center gap-2">
                      <UserButton /> <span className="text-sm text-neutral">Account</span>
                    </div>
                  </Show>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
