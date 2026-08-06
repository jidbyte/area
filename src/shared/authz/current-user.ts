import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { appUser } from "@/shared/db/schema";

/**
 * Lazily creates (or returns) the local `app_user` row for the signed-in
 * Clerk user. We keep our own row rather than trusting Clerk alone because
 * `accountType` and account membership are app-level concepts Clerk doesn't
 * model — this is the row every account_member/invitation/can() lookup
 * joins against.
 *
 * Called on-demand (setup, invitation accept, onboarding) rather than via a
 * Clerk webhook, since a webhook needs a public endpoint + signing secret to
 * wire up on your end first. If webhook-based sync is preferred later, this
 * function's insert becomes an upsert-on-conflict and the webhook just calls
 * it — no callers need to change.
 */
export async function ensureAppUser(): Promise<{
  id: string;
  clerkUserId: string;
  accountType: "buyer" | "business";
  onboardingCompletedAt: Date | null;
} | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const existing = await db.query.appUser.findFirst({
    where: eq(appUser.clerkUserId, clerkUserId),
    columns: {
      id: true,
      clerkUserId: true,
      accountType: true,
      onboardingCompletedAt: true,
    },
  });
  if (existing) return existing;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null
    : null;

  const [created] = await db
    .insert(appUser)
    .values({ clerkUserId, email, name })
    .onConflictDoNothing({ target: appUser.clerkUserId })
    .returning({
      id: appUser.id,
      clerkUserId: appUser.clerkUserId,
      accountType: appUser.accountType,
      onboardingCompletedAt: appUser.onboardingCompletedAt,
    });

  // onConflictDoNothing returns nothing on a race (two requests inserting
  // at once) — re-fetch in that rare case rather than returning undefined.
  if (created) return created;
  const refetched = await db.query.appUser.findFirst({
    where: eq(appUser.clerkUserId, clerkUserId),
    columns: {
      id: true,
      clerkUserId: true,
      accountType: true,
      onboardingCompletedAt: true,
    },
  });
  return refetched ?? null;
}
