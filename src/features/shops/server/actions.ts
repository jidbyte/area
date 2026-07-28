"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

import { db } from "@/db";
import { shop } from "@/db/schema";
import { isPlatformAdmin } from "@/features/auth/server/platform-admin";
import { createShopSchema, type CreateShopInput } from "./schema";
import { getShopBySlug } from "./queries";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

export async function createShop(
  input: CreateShopInput,
): Promise<ActionResult<{ slug: string }>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to create a shop." };
  }

  const parsed = createShopSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { name, slug, description, address, email, contact } = parsed.data;

  const existing = await getShopBySlug(slug);
  if (existing) {
    return { success: false, error: "That name is already taken." };
  }

  // The shop IS a Clerk Organization — the creating user becomes its
  // org:admin automatically (Clerk's default behavior for createdBy).
  const client = await clerkClient();

  let orgId: string;
  try {
    const org = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    });
    orgId = org.id;
  } catch (err) {
    // Log the full error server-side for debugging (never shown to the user).
    console.error("[createShop] Clerk organization creation failed:", err);

    if (isClerkAPIResponseError(err)) {
      const first = err.errors[0];
      // Most common cause during setup: Organizations feature is disabled
      // for this Clerk application (Dashboard → Organizations → Enable).
      if (first?.code === "organizations_not_enabled_in_instance") {
        return {
          success: false,
          error:
            "Organizations aren't enabled for this Clerk app yet. Enable them in the Clerk Dashboard under Organizations, then try again.",
        };
      }
      if (
        first?.code === "organization_slug_exists" ||
        first?.code === "duplicate_record"
      ) {
        return { success: false, error: "That name is already taken." };
      }
      return {
        success: false,
        error:
          first?.longMessage ??
          first?.message ??
          "Could not create the shop. Please try again.",
      };
    }

    return {
      success: false,
      error: "Could not create the shop. Please try again.",
    };
  }

  await db.insert(shop).values({
    clerkOrgId: orgId,
    name,
    slug,
    description: description || null,
    address: address || null,
    email: email || null,
    contact: contact || null,
    status: "pending",
    isActive: false,
  });

  revalidatePath("/admin/shops");
  return { success: true, data: { slug } };
}

export async function approveShop(shopId: string): Promise<ActionResult> {
  if (!(await isPlatformAdmin())) {
    return { success: false, error: "Not authorized." };
  }
  await db
    .update(shop)
    .set({ status: "approved", isActive: true })
    .where(eq(shop.id, shopId));
  revalidatePath("/admin/shops");
  return { success: true, data: undefined };
}

export async function suspendShop(shopId: string): Promise<ActionResult> {
  if (!(await isPlatformAdmin())) {
    return { success: false, error: "Not authorized." };
  }
  await db
    .update(shop)
    .set({ status: "suspended", isActive: false })
    .where(eq(shop.id, shopId));
  revalidatePath("/admin/shops");
  return { success: true, data: undefined };
}
