"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { appUser } from "@/shared/db/schema";
import { ensureAppUser } from "@/shared/authz/current-user";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * The "Buyer" side of the two-card onboarding chooser. The "Business" side
 * doesn't need its own action — it just routes to /setup, and completeSetup
 * itself sets accountType: "business" once the store is actually created
 * (see features/shops/server/actions.ts). accountType is a UX default, not
 * an access-control boundary — see the note in schema/users.ts.
 */
export async function chooseBuyerAccountType(): Promise<
  ActionResult<{ clerkUserId: string }>
> {
  const user = await ensureAppUser();
  if (!user) return { success: false, error: "You must be signed in." };

  await db
    .update(appUser)
    .set({
      accountType: "buyer",
      onboardingCompletedAt: user.onboardingCompletedAt ?? new Date(),
    })
    .where(eq(appUser.id, user.id));

  return { success: true, data: { clerkUserId: user.clerkUserId } };
}
