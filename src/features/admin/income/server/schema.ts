import { z } from "zod";

export const incomeSchema = z.object({
  source: z.string().min(1, "Required").max(120),
  description: z.string().max(200).optional().or(z.literal("")),
  amount: z.number().int().min(1, "Must be more than 0"),
  incomeDate: z.string().min(1, "Required"), // yyyy-mm-dd from <input type="date">
});

export type IncomeInput = z.infer<typeof incomeSchema>;
