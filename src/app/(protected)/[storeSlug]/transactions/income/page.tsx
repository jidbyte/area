import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listIncomeByShop } from "@/features/admin/income/server/actions";
import { IncomeTable } from "@/features/admin/income/client/income-table";
import { IncomeFormDialog } from "@/features/admin/income/client/income-form-dialog";

export default async function IncomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const income = await listIncomeByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Income</h1>
          <p className="text-sm text-neutral">
            Revenue that doesn't come from a direct sale.
          </p>
        </div>
        <IncomeFormDialog shopId={shop.id} />
      </div>

      <IncomeTable shopId={shop.id} currency={shop.currency} income={income} />
    </div>
  );
}
