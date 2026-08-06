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
import {
  createInvoiceFromSaleSchema,
  type CreateInvoiceFromSaleInput,
} from "@/features/admin/invoices/server/schema";
import { createInvoiceFromSale } from "@/features/admin/invoices/server/actions";

export type SaleOption = { id: string; saleNumber: string; customerName: string };

export function CreateInvoiceDialog({
  shopId,
  sales,
}: {
  shopId: string;
  sales: SaleOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInvoiceFromSaleInput>({
    resolver: zodResolver(createInvoiceFromSaleSchema),
    defaultValues: { saleId: "", dueDate: "", notes: "" },
  });

  const onSubmit = (values: CreateInvoiceFromSaleInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createInvoiceFromSale(shopId, values);
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
        <Button shape="round">
          <Plus className="size-4" /> New invoice
        </Button>
      </DialogTrigger>

      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Generate invoice from a sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Sale" htmlFor="saleId" error={errors.saleId?.message}>
            <select
              id="saleId"
              className="h-9 w-full rounded-md border border-muted/40 bg-surface px-3 text-sm text-ink"
              {...register("saleId")}
            >
              <option value="">Select a sale...</option>
              {sales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.saleNumber} — {s.customerName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Due date (optional)" htmlFor="dueDate">
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </FormField>

          <FormField label="Notes (optional)" htmlFor="notes">
            <Input id="notes" {...register("notes")} />
          </FormField>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
            {isPending ? "Creating..." : "Create invoice"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
