"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, MessageCircle, CheckCircle2, Ban, FileText } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatPrice } from "@/shared/utils/currency";
import {
  sendInvoiceByEmail,
  sendInvoiceByWhatsapp,
  markInvoicePaid,
  voidInvoice,
  generateInvoicePdf,
} from "@/features/admin/invoices/server/actions";

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  issueDate: Date;
  pdfUrl: string | null;
};

const STATUS_STYLE: Record<InvoiceRow["status"], string> = {
  draft: "text-neutral",
  sent: "text-primary",
  paid: "text-success",
  overdue: "text-danger",
  void: "text-neutral line-through",
};

export function InvoicesTable({
  currency,
  invoices,
}: {
  currency: string;
  invoices: InvoiceRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  function run(id: string, action: () => Promise<{ success: boolean; error?: string }>) {
    setPendingId(id);
    setErrorById((prev) => ({ ...prev, [id]: "" }));
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setErrorById((prev) => ({ ...prev, [id]: result.error ?? "Something went wrong." }));
        return;
      }
      router.refresh();
    });
  }

  if (invoices.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral">No invoices yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-48">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => {
          const busy = isPending && pendingId === inv.id;
          return (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
              <TableCell>{inv.customerName}</TableCell>
              <TableCell>{inv.issueDate.toLocaleDateString()}</TableCell>
              <TableCell className="text-right">{formatPrice(inv.totalAmount, currency)}</TableCell>
              <TableCell className={STATUS_STYLE[inv.status]}>{inv.status}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  {inv.pdfUrl ? (
                    <Button asChild variant="ghost" size="icon" aria-label="View PDF">
                      <Link href={inv.pdfUrl} target="_blank">
                        <FileText className="size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Generate PDF"
                      disabled={busy}
                      onClick={() => run(inv.id, () => generateInvoicePdf(inv.id))}
                    >
                      <FileText className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Send by email"
                    disabled={busy || !inv.customerEmail}
                    title={!inv.customerEmail ? "No email on file" : "Send by email"}
                    onClick={() => run(inv.id, () => sendInvoiceByEmail(inv.id))}
                  >
                    <Mail className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Send by WhatsApp"
                    disabled={busy || !inv.customerPhone}
                    title={!inv.customerPhone ? "No phone on file" : "Send by WhatsApp"}
                    onClick={() => run(inv.id, () => sendInvoiceByWhatsapp(inv.id))}
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                  {inv.status !== "paid" && inv.status !== "void" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mark paid"
                      disabled={busy}
                      onClick={() => run(inv.id, () => markInvoicePaid(inv.id))}
                    >
                      <CheckCircle2 className="size-4" />
                    </Button>
                  )}
                  {inv.status !== "void" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Void invoice"
                      disabled={busy}
                      onClick={() => run(inv.id, () => voidInvoice(inv.id))}
                    >
                      <Ban className="size-4" />
                    </Button>
                  )}
                </div>
                {errorById[inv.id] && (
                  <p className="mt-1 text-xs text-danger">{errorById[inv.id]}</p>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
