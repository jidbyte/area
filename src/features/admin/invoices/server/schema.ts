import { z } from "zod";

export const createInvoiceFromSaleSchema = z.object({
  saleId: z.string().min(1, "Pick a sale"),
  dueDate: z.string().optional().or(z.literal("")), // yyyy-mm-dd
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type CreateInvoiceFromSaleInput = z.infer<typeof createInvoiceFromSaleSchema>;
