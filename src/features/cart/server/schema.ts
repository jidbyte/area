import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Required").max(120),
  email: z.email("Enter a valid email"),
  phone: z.string().min(4, "Required").max(40),
  address: z.string().min(4, "Required").max(200),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
