import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { ShopSettingsForm } from "@/features/shops/client/shop-settings-form";
import { DeleteShopButton } from "@/features/shops/client/delete-shop-button";

export default async function ShopSettingsPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shop info</CardTitle>
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

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteShopButton />
        </CardContent>
      </Card>
    </div>
  );
}
