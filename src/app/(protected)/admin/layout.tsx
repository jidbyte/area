import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { getShopForCurrentUser } from "@/features/shops/server/queries";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/suppliers", label: "Suppliers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // (protected)/layout.tsx already guarantees a signed-in user here.
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          {/* The org's own name stands in for the platform logo here — once
              you're inside a shop's dashboard, that's the identity that matters. */}
          <span className="truncate text-lg font-semibold">{shop.name}</span>
          <UserButton />
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 px-4 pb-3 text-sm sm:px-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
    </div>
  );
}
