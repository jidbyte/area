import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { getCurrencySymbol } from "@/shared/config/currencies";
import { DeleteShopButton } from "@/features/shops/client/delete-shop-button";

export default async function AdminDashboardPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Buyers can find you at <span className="font-medium">/{shop.slug}</span> — prices show
          in {getCurrencySymbol(shop.currency)} ({shop.currency}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sales figures populate once buyers can check out — that arrives with the Cart &amp;
            Checkout phases.
          </p>
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
