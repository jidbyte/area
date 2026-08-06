import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().optional().or(z.literal("")),
  productName: z.string().min(1, "Required").max(120),
  productCode: z.string().max(64).optional().or(z.literal("")),
  productSku: z.string().min(1, "Required").max(64),
  quantity: z.number().int().min(1, "Must be at least 1"),
  unitCost: z.number().int().min(0, "Must be 0 or more"),
});

// Discount is a flat amount only for now, not a percent — the original
// schema tracked both, but supporting two inputs that could disagree about
// the actual discount adds ambiguity without adding much value yet.
export const createPurchaseSchema = z.object({
  supplierId: z.string().optional().or(z.literal("")),
  supplierName: z.string().min(1, "Required").max(120),
  purchaseDate: z.string().min(1, "Required"),
  eta: z.string().optional().or(z.literal("")),
  shippingCost: z.number().int().min(0),
  discountAmount: z.number().int().min(0),
  items: z.array(purchaseItemSchema).min(1, "Add at least one item"),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const PURCHASE_STATUSES = [
  "draft",
  "ordered",
  "shipped",
  "received",
  "cancelled",
] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "partial",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
