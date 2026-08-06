import { and, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import {
  accountMember,
  appUser,
  rolePermission,
  permission,
} from "@/shared/db/schema";
import type { PermissionKey } from "@/shared/db/schema/users";

/**
 * Account-based access control, matching the GitHub-org / Notion-workspace
 * pattern: a user's authority comes from their (user, account) membership
 * row and that row's role's granted permissions — never from a role name
 * compared directly in application code.
 *
 * Every mutating server action must call this (or requireCan below) rather
 * than relying on the UI hiding a button. A 403 from here is the actual
 * security boundary; hidden buttons are only a convenience.
 */
export async function can(
  clerkUserId: string,
  accountId: string,
  permissionKey: PermissionKey,
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
    columns: { roleId: true },
  });
  if (!membership) return false;

  const hasGrant = await db
    .select({ id: rolePermission.roleId })
    .from(rolePermission)
    .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
    .where(
      and(
        eq(rolePermission.roleId, membership.roleId),
        eq(permission.key, permissionKey),
      ),
    )
    .limit(1);

  return hasGrant.length > 0;
}

export type AuthzResult =
  | { ok: true; userId: string; accountId: string }
  | { ok: false; error: string };

/**
 * Convenience wrapper for server actions: resolves the current Clerk user,
 * checks the permission, and returns a discriminated result so callers can
 * `if (!authResult.ok) return { success: false, error: authResult.error }`
 * the same way requireShopMembership already works elsewhere in the app.
 */
export async function requireCan(
  clerkUserId: string | null | undefined,
  accountId: string,
  permissionKey: PermissionKey,
): Promise<AuthzResult> {
  if (!clerkUserId) {
    return { ok: false, error: "You must be signed in." };
  }
  const allowed = await can(clerkUserId, accountId, permissionKey);
  if (!allowed) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, userId: clerkUserId, accountId };
}
