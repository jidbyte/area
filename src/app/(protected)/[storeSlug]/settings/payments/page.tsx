import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import {
  PaystackSetupForm,
  type BankOption,
} from "@/features/app/stores/client/paystack-setup-form";
import { listBanks } from "@/shared/lib/paystack";
import { paystackCountryForCurrency } from "@/shared/config/paystack";

export default async function PaymentsSettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const bankResult = await listBanks(
    paystackCountryForCurrency(shop.currency),
    shop.currency,
  );
  const banks: BankOption[] = bankResult.ok
    ? bankResult.data.map((b) => ({ name: b.name, code: b.code }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Paystack</CardTitle>
      </CardHeader>
      <CardContent>
        {banks.length === 0 && !bankResult.ok ? (
          <p className="text-danger text-sm">
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
  );
}
