import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listExpensesByShop } from "@/features/admin/expenses/server/actions";
import { ExpensesTable } from "@/features/admin/expenses/client/expenses-table";
import { ExpenseFormDialog } from "@/features/admin/expenses/client/expense-form-dialog";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const expenses = await listExpensesByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Expenses</h1>
          <p className="text-sm text-neutral">
            General business spend not tied to a purchase order.
          </p>
        </div>
        <ExpenseFormDialog shopId={shop.id} />
      </div>

      <ExpensesTable shopId={shop.id} currency={shop.currency} expenses={expenses} />
    </div>
  );
}
