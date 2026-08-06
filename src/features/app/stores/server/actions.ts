"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

import { db } from "@/shared/db";
import { shop, accountMember, role, appUser } from "@/shared/db/schema";
import { ensureAppUser } from "@/shared/authz/current-user";
import { getShopBySlug, getShopForCurrentUser } from "./queries";
import { requireShopMembership } from "./authorize";
import {
  PaystackSetupInput,
  paystackSetupSchema,
  setupSchema,
  shopSettingsSchema,
  type SetupInput,
  type ShopSettingsInput,
} from "./schema";
import { PLATFORM_COMMISSION_BPS } from "@/shared/config/paystack";
import { updateSubaccount, createSubaccount } from "@/shared/lib/paystack";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function completeSetup(input: SetupInput): Promise<ActionResult<{ slug: string }>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  // Application-level "one owned store per account" rule — enforced here by
  // checking for an existing Owner membership before ever creating another
  // one (account_member itself allows a user to belong to many accounts,
  // just not to *own* more than one, for now).
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

  const user = await ensureAppUser();
  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const ownerRole = await db.query.role.findFirst({
    where: eq(role.name, "Owner"),
    columns: { id: true },
  });
  if (!ownerRole) {
    // Roles/permissions haven't been seeded yet — see `npm run db:seed`.
    console.error("[completeSetup] Owner role not found — has db:seed run?");
    return {
      success: false,
      error: "Store setup isn't fully configured yet. Please try again shortly.",
    };
  }

  let created: typeof shop.$inferSelect;
  try {
    [created] = await db
      .insert(shop)
      .values({ name, slug, currency, isActive: true })
      .returning();
  } catch (err) {
    console.error("[completeSetup] shop insert failed:", err);
    return { success: false, error: "Could not set up your shop. Please try again." };
  }

  try {
    await db.insert(accountMember).values({
      userId: user.id,
      accountId: created.id,
      roleId: ownerRole.id,
    });
    await db
      .update(appUser)
      .set({
        accountType: "business",
        onboardingCompletedAt: user.onboardingCompletedAt ?? new Date(),
      })
      .where(eq(appUser.id, user.id));
  } catch (err) {
    // Membership insert failed after the shop row was already created —
    // clean up the orphaned shop rather than leaving an ownerless one.
    console.error("[completeSetup] account_member insert failed, rolling back shop:", err);
    await db.delete(shop).where(eq(shop.id, created.id));
    return { success: false, error: "Could not set up your shop. Please try again." };
  }

  // Best-effort: also create a matching Clerk Organization so Clerk's own
  // dashboard/session UI has something to show, but store creation no
  // longer depends on it succeeding (see clerkOrgId comment in schema).
  try {
    const client = await clerkClient();
    const org = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    });
    await db.update(shop).set({ clerkOrgId: org.id }).where(eq(shop.id, created.id));
  } catch (err) {
    if (!(isClerkAPIResponseError(err) && err.errors[0]?.code === "organizations_not_enabled_in_instance")) {
      console.error("[completeSetup] optional Clerk organization creation failed:", err);
    }
  }

  revalidatePath(`/${slug}/dashboard`);
  return { success: true, data: { slug } };
}

export async function updateShopSettings(
  input: ShopSettingsInput,
): Promise<ActionResult> {
  const currentShop = await getShopForCurrentUser();
  if (!currentShop) {
    return { success: false, error: "You must have a shop set up first." };
  }

  const parsed = shopSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { name, description, address, email, phone } = parsed.data;

  // Keep the Clerk organization's name in sync, if one exists (best-effort
  // — Clerk orgs are optional now, see the clerkOrgId comment in schema).
  if (name !== currentShop.name && currentShop.clerkOrgId) {
    const client = await clerkClient();
    try {
      await client.organizations.updateOrganization(currentShop.clerkOrgId, {
        name,
      });
    } catch (err) {
      console.error("[updateShopSettings] Clerk org name update failed (non-fatal):", err);
    }
  }

  await db
    .update(shop)
    .set({
      name,
      description: description || null,
      address: address || null,
      email: email || null,
      phone: phone || null,
    })
    .where(eq(shop.id, currentShop.id));

  revalidatePath(`/${currentShop.slug}/settings`);
  revalidatePath(`/${currentShop.slug}/dashboard`);
  revalidatePath(`/stores/${currentShop.slug}`);
  return { success: true, data: undefined };
}

export async function setupPaystackSubaccount(
  input: PaystackSetupInput,
): Promise<ActionResult<{ subaccountCode: string }>> {
  const currentShop = await getShopForCurrentUser();
  if (!currentShop) {
    return { success: false, error: "You must have a shop set up first." };
  }

  const parsed = paystackSetupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { bankCode, accountNumber } = parsed.data;

  const params = {
    businessName: currentShop.name,
    bankCode,
    accountNumber,
    percentageCharge: PLATFORM_COMMISSION_BPS / 100,
  };

  const result = currentShop.paystackSubaccountCode
    ? await updateSubaccount(currentShop.paystackSubaccountCode, params)
    : await createSubaccount(params);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  await db
    .update(shop)
    .set({
      paystackSubaccountCode: result.data.subaccount_code,
      // Backfills existing shops created before the 2.5% commission was
      // decided — new shops don't need this since the schema default
      // already matches, but this keeps the two paths converging on the
      // same value either way.
      commissionRate: PLATFORM_COMMISSION_BPS,
    })
    .where(eq(shop.id, currentShop.id));

  revalidatePath(`/${currentShop.slug}/settings`);
  return {
    success: true,
    data: { subaccountCode: result.data.subaccount_code },
  };
}

export async function deleteShop(): Promise<ActionResult> {
  const currentShop = await getShopForCurrentUser();
  if (!currentShop) {
    return { success: false, error: "You don't have a shop to delete." };
  }

  if (currentShop.clerkOrgId) {
    const client = await clerkClient();
    await client.organizations.deleteOrganization(currentShop.clerkOrgId).catch((err) => {
      // Even if Clerk-side deletion fails (e.g. already gone), still soft-delete
      // our row so the owner isn't stuck — this is a deliberate, rare exception
      // to "never hide errors": losing the org record is worse than a stray
      // orphaned Clerk org, which can be cleaned up manually.
      console.error("[deleteShop] Clerk organization deletion failed:", err);
    });
  }

  await db
    .update(shop)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(shop.id, currentShop.id));

  redirect("/");
}

export async function updateNotificationPreferences(
  shopId: string,
  input: { emailNotificationsEnabled: boolean; whatsappNotificationsEnabled: boolean },
): Promise<ActionResult> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db
    .update(shop)
    .set({
      emailNotificationsEnabled: input.emailNotificationsEnabled,
      whatsappNotificationsEnabled: input.whatsappNotificationsEnabled,
    })
    .where(eq(shop.id, shopId));

  revalidatePath(`/${authResult.shop.slug}/settings/notifications`);
  return { success: true, data: undefined };
}
