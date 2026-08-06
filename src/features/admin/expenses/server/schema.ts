import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "tax",
  "bills",
  "salaries",
  "rent",
  "marketing",
  "other",
] as const;

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().min(1, "Required").max(200),
  amount: z.number().int().min(1, "Must be more than 0"),
  expenseDate: z.string().min(1, "Required"), // yyyy-mm-dd from <input type="date">
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
