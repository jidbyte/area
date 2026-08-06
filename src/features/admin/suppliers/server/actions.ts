"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { supplier } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import { supplierSchema, type SupplierInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

export async function createSupplier(
  shopId: string,
  input: SupplierInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { companyName, contactName, phone, email, website, address } =
    parsed.data;

  const [created] = await db
    .insert(supplier)
    .values({
      shopId,
      companyName,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      address: address || null,
    })
    .returning();

  revalidatePath(`/${authResult.shop.slug}/suppliers`);
  return { success: true, data: { id: created.id } };
}

export async function updateSupplier(
  supplierId: string,
  input: SupplierInput,
): Promise<ActionResult> {
  const existing = await db.query.supplier.findFirst({
    where: eq(supplier.id, supplierId),
  });
  if (!existing) return { success: false, error: "Supplier not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { companyName, contactName, phone, email, website, address } =
    parsed.data;

  await db
    .update(supplier)
    .set({
      companyName,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      address: address || null,
    })
    .where(eq(supplier.id, supplierId));

  revalidatePath(`/${authResult.shop.slug}/suppliers`);
  return { success: true, data: undefined };
}

export async function deleteSupplier(
  supplierId: string,
): Promise<ActionResult> {
  const existing = await db.query.supplier.findFirst({
    where: eq(supplier.id, supplierId),
  });
  if (!existing) return { success: false, error: "Supplier not found." };

  const authResult = await requireShopMembership(existing.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db
    .update(supplier)
    .set({ deletedAt: new Date() })
    .where(eq(supplier.id, supplierId));

  revalidatePath(`/${authResult.shop.slug}/suppliers`);
  return { success: true, data: undefined };
}
