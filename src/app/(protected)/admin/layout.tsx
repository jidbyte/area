import { redirect } from "next/navigation";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { AdminHead } from "@/shared/components/admin/admin-head";
import { AdminNavigationTabs } from "@/shared/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="min-h-screen">
      <header>
        <AdminHead shopName={shop.name} shopSlug={shop.slug} />
        <AdminNavigationTabs />
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:px-8">{children}</main>
    </div>
  );
}
