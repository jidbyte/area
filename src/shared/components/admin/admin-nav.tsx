"use client";

import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { NAV_ITEMS } from "./admin-head";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNavigationTabs() {
  const pathname = usePathname();
  const activeHref = NAV_ITEMS.find((item) =>
    isActive(pathname, item.href),
  )?.href;

  return (
    <div className="border-b border-ink/10 hidden md:block bg-muted/30">
      <div className="mx-auto max-w-7xl sm:px-8 py-1.5">
        <Tabs value={activeHref}>
          <TabsList variant="line" className="flex gap-6">
            {NAV_ITEMS.map((item) => (
              <TabsTrigger
                key={item.href}
                value={item.href}
                asChild
                className={cn(
                  "font-semibold border-none text-ink/70 px-0 hover:text-ink",
                  "data-[state=active]:underline underline-offset-20 under data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary data-[state=active]:font-bold",
                  "",
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
