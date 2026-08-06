import { auth } from "@clerk/nextjs/server";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { isMemberOfAccount } from "@/features/app/stores/server/membership";
import { AdminHead } from "@/features/admin/shared/client/admin-head";
import { AdminNavigationTabs } from "@/features/admin/shared/client/admin-nav";
import { notFound, redirect } from "next/navigation";

// Gates every /[storeSlug]/* dashboard route. This checks *membership* of
// the specific store named in the URL (any role — page/action-level code
// enforces specific permissions via requireShopPermission), not just
// "does this user own a store" — a user can now be staff (Editor/Viewer)
// on a store they don't own, per the account-based access control model.
export default async function StoreDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const store = await getShopBySlug(storeSlug);
  if (!store) notFound();

  const isMember = await isMemberOfAccount(userId, store.id);
  if (!isMember) redirect("/setup");

  return (
    <div className="min-h-screen">
      <header>
        <AdminHead shopName={store.name} shopSlug={store.slug} />
        <AdminNavigationTabs storeSlug={store.slug} />
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:px-8">{children}</main>
    </div>
  );
}
