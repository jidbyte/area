import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { ShopSettingsForm } from "@/features/shops/client/shop-settings-form";
import {
  PaystackSetupForm,
  type BankOption,
} from "@/features/shops/client/paystack-setup-form";
import { DeleteShopButton } from "@/features/shops/client/delete-shop-button";
import { listBanks } from "@/shared/lib/paystack";
import { paystackCountryForCurrency } from "@/shared/config/paystack";

export default async function ShopSettingsPage() {
  const shop = await getShopForCurrentUser();
  if (!shop) redirect("/setup");

  const bankResult = await listBanks(
    paystackCountryForCurrency(shop.currency),
    shop.currency,
  );
  const banks: BankOption[] = bankResult.ok
    ? bankResult.data.map((b) => ({ name: b.name, code: b.code }))
    : [];

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {banks.length === 0 && !bankResult.ok ? (
            <p className="text-destructive text-sm">
              Couldn&apos;t load the bank list right now ({bankResult.error}).
              Check your Paystack API keys and try again.
            </p>
          ) : (
            <PaystackSetupForm
              banks={banks}
              isConnected={!!shop.paystackSubaccountCode}
              commissionPercent={shop.commissionRate / 100}
            />
          )}
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
