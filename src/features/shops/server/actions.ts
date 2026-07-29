"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

import { db } from "@/shared/db";
import { shop } from "@/shared/db/schema";
import { setupSchema, type SetupInput } from "./schema";
import { getShopBySlug, getShopForCurrentUser } from "./queries";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function completeSetup(input: SetupInput): Promise<ActionResult<{ slug: string }>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  // Application-level "one org per account" rule — Clerk itself doesn't cap
  // membership at one, so this check is what actually enforces it.
  const existing = await getShopForCurrentUser();
  if (existing) {
    return { success: false, error: "You already have a shop set up." };
  }

  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, slug, currency } = parsed.data;

  const slugTaken = await getShopBySlug(slug);
  if (slugTaken) {
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
    console.error("[completeSetup] Clerk organization creation failed:", err);

    if (isClerkAPIResponseError(err)) {
      const first = err.errors[0];
      if (first?.code === "organizations_not_enabled_in_instance") {
        return {
          success: false,
          error:
            "Organizations aren't enabled for this Clerk app yet. Enable them in the Clerk Dashboard under Organizations, then try again.",
        };
      }
      if (first?.code === "organization_slug_exists" || first?.code === "duplicate_record") {
        return { success: false, error: "That name is already taken." };
      }
      return {
        success: false,
        error: first?.longMessage ?? first?.message ?? "Could not set up your shop. Please try again.",
      };
    }

    return { success: false, error: "Could not set up your shop. Please try again." };
  }

  try {
    await db.insert(shop).values({
      clerkOrgId: orgId,
      name,
      slug,
      currency,
      isActive: true,
    });
  } catch (err) {
    // DB insert failed after the Clerk org was already created — clean up
    // the orphaned org rather than leaving a dangling, invisible one.
    console.error("[completeSetup] shop insert failed, rolling back Clerk org:", err);
    await client.organizations.deleteOrganization(orgId).catch(() => {});
    return { success: false, error: "Could not set up your shop. Please try again." };
  }

  revalidatePath("/admin");
  return { success: true, data: { slug } };
}

export async function deleteShop(): Promise<ActionResult> {
  const currentShop = await getShopForCurrentUser();
  if (!currentShop) {
    return { success: false, error: "You don't have a shop to delete." };
  }

  const client = await clerkClient();
  await client.organizations.deleteOrganization(currentShop.clerkOrgId).catch((err) => {
    // Even if Clerk-side deletion fails (e.g. already gone), still soft-delete
    // our row so the owner isn't stuck — this is a deliberate, rare exception
    // to "never hide errors": losing the org record is worse than a stray
    // orphaned Clerk org, which can be cleaned up manually.
    console.error("[deleteShop] Clerk organization deletion failed:", err);
  });

  await db
    .update(shop)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(shop.id, currentShop.id));

  redirect("/");
}
