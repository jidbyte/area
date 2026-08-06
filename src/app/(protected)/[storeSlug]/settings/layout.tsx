import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { SettingsNav } from "@/features/admin/shared/client/settings-nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-ink">Settings</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav storeSlug={storeSlug} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
