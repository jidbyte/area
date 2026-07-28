import { Card, CardContent } from "@/components/ui/card";
import { listShops } from "@/features/shops/server/queries";
import { ShopStatusActions } from "@/features/shops/client/shop-status-actions";

export default async function AdminShopsPage() {
  const shops = await listShops();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Shops</h1>

      {shops.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No shops have been created yet.
        </p>
      )}

      {shops.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">
                {s.name}{" "}
                <span className="text-muted-foreground text-xs">/{s.slug}</span>
              </p>
              <p className="text-muted-foreground text-xs capitalize">
                {s.status}
              </p>
            </div>
            <ShopStatusActions shopId={s.id} status={s.status} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
