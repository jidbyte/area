"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ArrowRight, Menu, Settings } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { cn } from "@/shared/lib/utils";

export const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminHead({
  shopName,
  shopSlug
}: {
  shopName: string;
  shopSlug: string;
}) {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex max-w-7xl p-4 sm:px-8 items-center justify-between gap-8">
        <div className="flex items-center justify-center gap-4">
          <NavigationMenu shopName={shopName} />

          <span className="truncate text-lg md:text-2xl text-ink/90 font-extrabold">
            {shopName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* <Button asChild aria-label="View Shop">
            <Link href={`/${shopSlug}`}>
              View Shop <ArrowRight />
            </Link>
          </Button> */}

          <Button asChild variant="ghost" size="icon" aria-label="Settings">
            <Link href="/admin/settings">
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

function NavigationMenu({ shopName }: { shopName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(pathname: string, href: string) {
    return href === "/admin"
      ? pathname === "/admin"
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
            {NAV_ITEMS.map((item) => {
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
