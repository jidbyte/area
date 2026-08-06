"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatPrice } from "@/shared/utils/currency";
import { deleteExpense } from "@/features/admin/expenses/server/actions";
import type { EXPENSE_CATEGORIES } from "@/features/admin/expenses/server/schema";
import { ExpenseFormDialog } from "./expense-form-dialog";

export type ExpenseRow = {
  id: string;
  category: (typeof EXPENSE_CATEGORIES)[number];
  description: string;
  amount: number;
  expenseDate: Date;
};

const CATEGORY_LABEL: Record<string, string> = {
  tax: "Tax",
  bills: "Bills",
  salaries: "Salaries",
  rent: "Rent",
  marketing: "Marketing",
  other: "Other",
};

export function ExpensesTable({
  shopId,
  currency,
  expenses,
}: {
  shopId: string;
  currency: string;
  expenses: ExpenseRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await deleteExpense(id);
      router.refresh();
    });
  }

  if (expenses.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral">No expenses recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((e) => (
          <TableRow key={e.id}>
            <TableCell>{e.expenseDate.toLocaleDateString()}</TableCell>
            <TableCell>{CATEGORY_LABEL[e.category] ?? e.category}</TableCell>
            <TableCell className="max-w-xs truncate">{e.description}</TableCell>
            <TableCell className="text-right">{formatPrice(e.amount, currency)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <ExpenseFormDialog
                  shopId={shopId}
                  expenseId={e.id}
                  defaultValues={{
                    category: e.category,
                    description: e.description,
                    amount: e.amount,
                    expenseDate: e.expenseDate.toISOString().slice(0, 10),
                  }}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending && pendingId === e.id} loading={isPending && pendingId === e.id}
                  onClick={() => handleDelete(e.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
