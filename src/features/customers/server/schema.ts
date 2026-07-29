import { z } from "zod";

export const CUSTOMER_TYPES = ["individual", "business"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const customerSchema = z.object({
  name: z.string().min(2, "Required").max(120),
  customerType: z.enum(CUSTOMER_TYPES),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
