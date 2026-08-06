import { and, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { accountMember, appUser } from "@/shared/db/schema";

/**
 * DB-backed membership check — replaces the earlier Clerk-Organizations
 * version. Account membership now lives in our own account_member table
 * (see src/shared/db/schema/users.ts) so a user can hold different roles in
 * different stores, same as GitHub org / Notion workspace membership. Clerk
 * is still used for authentication/identity; it's no longer the source of
 * truth for "who belongs to this store."
 */
export async function isMemberOfAccount(
  clerkUserId: string,
  accountId: string,
): Promise<boolean> {
  const user = await db.query.appUser.findFirst({
    where: eq(appUser.clerkUserId, clerkUserId),
    columns: { id: true },
  });
  if (!user) return false;

  const membership = await db.query.accountMember.findFirst({
    where: and(
      eq(accountMember.userId, user.id),
      eq(accountMember.accountId, accountId),
    ),
    columns: { id: true },
  });
  return !!membership;
}
