"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatPrice } from "@/shared/utils/currency";
import { deleteIncome } from "@/features/admin/income/server/actions";
import { IncomeFormDialog } from "./income-form-dialog";

export type IncomeRow = {
  id: string;
  source: string;
  description: string | null;
  amount: number;
  incomeDate: Date;
};

export function IncomeTable({
  shopId,
  currency,
  income,
}: {
  shopId: string;
  currency: string;
  income: IncomeRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await deleteIncome(id);
      router.refresh();
    });
  }

  if (income.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral">No income recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {income.map((i) => (
          <TableRow key={i.id}>
            <TableCell>{i.incomeDate.toLocaleDateString()}</TableCell>
            <TableCell>{i.source}</TableCell>
            <TableCell className="max-w-xs truncate">{i.description ?? "—"}</TableCell>
            <TableCell className="text-right">{formatPrice(i.amount, currency)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <IncomeFormDialog
                  shopId={shopId}
                  incomeId={i.id}
                  defaultValues={{
                    source: i.source,
                    description: i.description ?? "",
                    amount: i.amount,
                    incomeDate: i.incomeDate.toISOString().slice(0, 10),
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
                  disabled={isPending && pendingId === i.id} loading={isPending && pendingId === i.id}
                  onClick={() => handleDelete(i.id)}
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
