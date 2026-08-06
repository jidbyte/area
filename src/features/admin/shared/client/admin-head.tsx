"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu, Settings } from "lucide-react";
import { ThemeToggle } from "@/shared/components/app/theme-toggle";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";

// Routes are now scoped under /[storeSlug]/... — build the nav list against
// the current store's slug rather than hardcoding /admin/*.
export function navItems(storeSlug: string) {
  return [
    { href: `/${storeSlug}/dashboard`, label: "Dashboard" },
    { href: `/${storeSlug}/products`, label: "Products" },
    { href: `/${storeSlug}/transactions`, label: "Transactions" },
    { href: `/${storeSlug}/customers`, label: "Customers" },
    { href: `/${storeSlug}/suppliers`, label: "Suppliers" },
    { href: `/${storeSlug}/reviews`, label: "Reviews" },
    { href: `/${storeSlug}/reports`, label: "Reports" },
    { href: `/${storeSlug}/analytics`, label: "Analytics" },
  ];
}

export function AdminHead({
  shopName,
  shopSlug,
}: {
  shopName: string;
  shopSlug: string;
}) {
  return (
    <div className="border-b border-muted/40">
      <div className="mx-auto flex max-w-7xl p-4 sm:px-8 items-center justify-between gap-8">
        <div className="flex items-center justify-center gap-4">
          <NavigationMenu shopName={shopName} storeSlug={shopSlug} />

          <span className="truncate text-lg md:text-2xl text-neutral font-extrabold">
            {shopName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Settings">
            <Link href={`/${shopSlug}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>

          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  );
}

function NavigationMenu({
  shopName,
  storeSlug,
}: {
  shopName: string;
  storeSlug: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems(storeSlug);
  const dashboardHref = `/${storeSlug}/dashboard`;

  function isActive(pathname: string, href: string) {
    return href === dashboardHref
      ? pathname === dashboardHref
      : pathname.startsWith(href);
  }

  return (
    <div className="block md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Menu className="size-5 mt-1.5" />
        </SheetTrigger>

        <SheetContent side="left" className="w-1/2">
          <SheetHeader>
            <SheetTitle className="px-2">{shopName}</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4 pb-4">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 font-medium transition-colors",
                    active
                      ? "bg-solid text-surface"
                      : "text-solid hover:bg-solid/10 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
