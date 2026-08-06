"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { expense } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import { expenseSchema, type ExpenseInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

export async function listExpensesByShop(shopId: string) {
  return db.query.expense.findMany({
    where: and(eq(expense.shopId, shopId), isNull(expense.deletedAt)),
    orderBy: [desc(expense.expenseDate)],
  });
}

export async function createExpense(
  shopId: string,
  input: ExpenseInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const [created] = await db
    .insert(expense)
    .values({
      shopId,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      expenseDate: new Date(parsed.data.expenseDate),
    })
    .returning();

  revalidatePath(`/${authResult.shop.slug}/transactions/expenses`);
  return { success: true, data: { id: created.id } };
}

export async function updateExpense(
  expenseId: string,
  input: ExpenseInput,
): Promise<ActionResult> {
  const existing = await db.query.expense.findFirst({ where: eq(expense.id, expenseId) });
  if (!existing) return { success: false, error: "Expense not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db
    .update(expense)
    .set({
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      expenseDate: new Date(parsed.data.expenseDate),
    })
    .where(eq(expense.id, expenseId));

  revalidatePath(`/${authResult.shop.slug}/transactions/expenses`);
  return { success: true, data: undefined };
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const existing = await db.query.expense.findFirst({ where: eq(expense.id, expenseId) });
  if (!existing) return { success: false, error: "Expense not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db.update(expense).set({ deletedAt: new Date() }).where(eq(expense.id, expenseId));

  revalidatePath(`/${authResult.shop.slug}/transactions/expenses`);
  return { success: true, data: undefined };
}
