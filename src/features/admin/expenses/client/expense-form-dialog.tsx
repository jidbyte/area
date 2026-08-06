"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { FormField } from "@/shared/components/common/form-field";
import { EXPENSE_CATEGORIES, expenseSchema, type ExpenseInput } from "@/features/admin/expenses/server/schema";
import { createExpense, updateExpense } from "@/features/admin/expenses/server/actions";

const CATEGORY_LABEL: Record<(typeof EXPENSE_CATEGORIES)[number], string> = {
  tax: "Tax",
  bills: "Bills",
  salaries: "Salaries",
  rent: "Rent",
  marketing: "Marketing",
  other: "Other",
};

export function ExpenseFormDialog({
  shopId,
  expenseId,
  trigger,
  defaultValues,
}: {
  shopId: string;
  expenseId?: string;
  trigger?: React.ReactNode;
  defaultValues?: Partial<ExpenseInput>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "other",
      description: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  const onSubmit = (values: ExpenseInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = expenseId
        ? await updateExpense(expenseId, values)
        : await createExpense(shopId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button shape="round">
            <Plus className="size-4" /> Add expense
          </Button>
        )}
      </DialogTrigger>

      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{expenseId ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Category" htmlFor="category" error={errors.category?.message}>
            <select
              id="category"
              className="h-9 w-full rounded-md border border-muted/40 bg-surface px-3 text-sm text-ink"
              {...register("category")}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <Input id="description" {...register("description")} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount" htmlFor="amount" error={errors.amount?.message}>
              <Input
                id="amount"
                type="number"
                step="1"
                {...register("amount", { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="Date" htmlFor="expenseDate" error={errors.expenseDate?.message}>
              <Input id="expenseDate" type="date" {...register("expenseDate")} />
            </FormField>
          </div>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
            {isPending ? "Saving..." : expenseId ? "Save changes" : "Add expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
