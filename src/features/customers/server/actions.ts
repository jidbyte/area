"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { customer } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/shops/server/authorize";
import { customerSchema, type CustomerInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

export async function createCustomer(
  shopId: string,
  input: CustomerInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { name, customerType, email, phone, address } = parsed.data;

  const [created] = await db
    .insert(customer)
    .values({
      shopId,
      name,
      customerType,
      email: email || null,
      phone: phone || null,
      address: address || null,
    })
    .returning();

  revalidatePath("/admin/customers");
  return { success: true, data: { id: created.id } };
}

export async function updateCustomer(
  customerId: string,
  input: CustomerInput,
): Promise<ActionResult> {
  const existing = await db.query.customer.findFirst({
    where: eq(customer.id, customerId),
  });
  if (!existing) return { success: false, error: "Customer not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { name, customerType, email, phone, address } = parsed.data;

  await db
    .update(customer)
    .set({
      name,
      customerType,
      email: email || null,
      phone: phone || null,
      address: address || null,
    })
    .where(eq(customer.id, customerId));

  revalidatePath("/admin/customers");
  return { success: true, data: undefined };
}

export async function deleteCustomer(
  customerId: string,
): Promise<ActionResult> {
  const existing = await db.query.customer.findFirst({
    where: eq(customer.id, customerId),
  });
  if (!existing) return { success: false, error: "Customer not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db
    .update(customer)
    .set({ deletedAt: new Date() })
    .where(eq(customer.id, customerId));

  revalidatePath("/admin/customers");
  return { success: true, data: undefined };
}
