"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { income } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import { incomeSchema, type IncomeInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

export async function listIncomeByShop(shopId: string) {
  return db.query.income.findMany({
    where: and(eq(income.shopId, shopId), isNull(income.deletedAt)),
    orderBy: [desc(income.incomeDate)],
  });
}

export async function createIncome(
  shopId: string,
  input: IncomeInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const [created] = await db
    .insert(income)
    .values({
      shopId,
      source: parsed.data.source,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      incomeDate: new Date(parsed.data.incomeDate),
    })
    .returning();

  revalidatePath(`/${authResult.shop.slug}/transactions/income`);
  return { success: true, data: { id: created.id } };
}

export async function updateIncome(
  incomeId: string,
  input: IncomeInput,
): Promise<ActionResult> {
  const existing = await db.query.income.findFirst({ where: eq(income.id, incomeId) });
  if (!existing) return { success: false, error: "Income record not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db
    .update(income)
    .set({
      source: parsed.data.source,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      incomeDate: new Date(parsed.data.incomeDate),
    })
    .where(eq(income.id, incomeId));

  revalidatePath(`/${authResult.shop.slug}/transactions/income`);
  return { success: true, data: undefined };
}

export async function deleteIncome(incomeId: string): Promise<ActionResult> {
  const existing = await db.query.income.findFirst({ where: eq(income.id, incomeId) });
  if (!existing) return { success: false, error: "Income record not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db.update(income).set({ deletedAt: new Date() }).where(eq(income.id, incomeId));

  revalidatePath(`/${authResult.shop.slug}/transactions/income`);
  return { success: true, data: undefined };
}
