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
import { incomeSchema, type IncomeInput } from "@/features/admin/income/server/schema";
import { createIncome, updateIncome } from "@/features/admin/income/server/actions";

export function IncomeFormDialog({
  shopId,
  incomeId,
  trigger,
  defaultValues,
}: {
  shopId: string;
  incomeId?: string;
  trigger?: React.ReactNode;
  defaultValues?: Partial<IncomeInput>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      source: "",
      description: "",
      amount: 0,
      incomeDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  const onSubmit = (values: IncomeInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = incomeId
        ? await updateIncome(incomeId, values)
        : await createIncome(shopId, values);
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
            <Plus className="size-4" /> Add income
          </Button>
        )}
      </DialogTrigger>

      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{incomeId ? "Edit income" : "Add income"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Source" htmlFor="source" error={errors.source?.message}>
            <Input id="source" placeholder="e.g. Affiliate payout" {...register("source")} />
          </FormField>

          <FormField label="Description (optional)" htmlFor="description" error={errors.description?.message}>
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

            <FormField label="Date" htmlFor="incomeDate" error={errors.incomeDate?.message}>
              <Input id="incomeDate" type="date" {...register("incomeDate")} />
            </FormField>
          </div>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
            {isPending ? "Saving..." : incomeId ? "Save changes" : "Add income"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
