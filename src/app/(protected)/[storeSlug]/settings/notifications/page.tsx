import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import { NotificationPreferencesForm } from "@/features/admin/shared/client/notification-preferences-form";

export default async function NotificationsSettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Order notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <NotificationPreferencesForm
          shopId={shop.id}
          defaultValues={{
            emailNotificationsEnabled: shop.emailNotificationsEnabled,
            whatsappNotificationsEnabled: shop.whatsappNotificationsEnabled,
          }}
        />
      </CardContent>
    </Card>
  );
}
