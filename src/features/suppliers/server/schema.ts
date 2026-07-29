import { z } from "zod";

export const supplierSchema = z.object({
  companyName: z.string().min(2, "Required").max(120),
  contactName: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
