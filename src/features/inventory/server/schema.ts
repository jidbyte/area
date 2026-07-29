import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url(),
  fileKey: z.string().min(1),
  isPrimary: z.boolean(),
});

// NOTE: price/cost are stored as whole-number integers (matching the product
// table's integer columns), same convention as the dummy data. Currency/cents
// handling gets revisited properly in the Payments phase.
export const createProductSchema = z.object({
  name: z.string().min(2, "Required").max(120),
  sku: z.string().min(1, "Required").max(64),
  brand: z.string().max(80).optional().or(z.literal("")),
  model: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  price: z.number().int().min(0, "Must be 0 or more"),
  cost: z.number().int().min(0, "Must be 0 or more"),
  quantity: z.number().int().min(0, "Must be 0 or more"),
  restockLevel: z.number().int().min(0, "Must be 0 or more"),
  optimalLevel: z.number().int().min(0, "Must be 0 or more"),
  categories: z.array(z.string().min(1)).max(10),
  images: z.array(productImageSchema).max(8),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
