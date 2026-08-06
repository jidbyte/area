import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { ShopSettingsForm } from "@/features/app/stores/client/shop-settings-form";
import { DeleteShopButton } from "@/features/app/stores/client/delete-shop-button";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShopSettingsForm
            defaultValues={{
              name: shop.name,
              description: shop.description ?? "",
              address: shop.address ?? "",
              email: shop.email ?? "",
              phone: shop.phone ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-neutral">
            Permanently removes this store. This can't be undone.
          </p>
          <DeleteShopButton />
        </CardContent>
      </Card>
    </div>
  );
}
