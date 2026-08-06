"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { accountMember, appUser, invitation, role } from "@/shared/db/schema";
import { ensureAppUser } from "@/shared/authz/current-user";
import { requireShopPermission } from "./authorize";
import { getShopById } from "./queries";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const INVITATION_TTL_DAYS = 7;

/**
 * Step 1-4 of the invite flow: owner picks a role, enters an email, we
 * create a pending invitation with a token. Sending the actual email is a
 * Phase 5 (messaging/notifications) concern — this returns the token so the
 * caller can wire up delivery (Resend is already in the stack).
 */
export async function createInvitation(
  accountId: string,
  email: string,
  roleName: "Owner" | "Admin" | "Editor" | "Viewer",
): Promise<ActionResult<{ token: string }>> {
  const authResult = await requireShopPermission(accountId, "users.invite");
  if (!authResult.ok) return { success: false, error: authResult.error };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: "Enter an email address." };
  }

  const targetRole = await db.query.role.findFirst({
    where: eq(role.name, roleName),
    columns: { id: true },
  });
  if (!targetRole) {
    return { success: false, error: "That role doesn't exist." };
  }

  // If they already have an account and are already a member, don't
  // re-invite — just say so.
  const existingUser = await db.query.appUser.findFirst({
    where: eq(appUser.email, normalizedEmail),
    columns: { id: true },
  });
  if (existingUser) {
    const alreadyMember = await db.query.accountMember.findFirst({
      where: and(
        eq(accountMember.userId, existingUser.id),
        eq(accountMember.accountId, accountId),
      ),
    });
    if (alreadyMember) {
      return { success: false, error: "That person is already a member." };
    }
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const inviter = await db.query.appUser.findFirst({
    where: eq(appUser.clerkUserId, authResult.userId),
    columns: { id: true },
  });
  if (!inviter) {
    // Shouldn't happen — requireShopPermission's can() check already needs
    // an app_user row to have granted access — but guard anyway.
    return { success: false, error: "Could not resolve your account. Try again." };
  }

  await db.insert(invitation).values({
    accountId,
    email: normalizedEmail,
    roleId: targetRole.id,
    token,
    invitedByUserId: inviter.id,
    expiresAt,
  });

  revalidatePath(`/${authResult.shop.slug}/settings`);
  return { success: true, data: { token } };
}

/**
 * Step 5-6: the invited person clicks the accept link. If they don't have
 * an account yet, the caller (the accept page) should send them through
 * sign-up first with ?invitation=<token> preserved, then call this again
 * once they're authenticated — see acceptInvitationAfterSignIn below for
 * that second half.
 */
export async function acceptInvitation(
  token: string,
): Promise<ActionResult<{ accountSlug: string }>> {
  const invite = await db.query.invitation.findFirst({
    where: eq(invitation.token, token),
  });
  if (!invite) return { success: false, error: "That invitation is invalid." };
  if (invite.status !== "pending") {
    return { success: false, error: "That invitation has already been used." };
  }
  if (invite.expiresAt < new Date()) {
    await db.update(invitation).set({ status: "expired" }).where(eq(invitation.id, invite.id));
    return { success: false, error: "That invitation has expired." };
  }

  const user = await ensureAppUser();
  if (!user) {
    return { success: false, error: "You must be signed in to accept an invitation." };
  }

  const account = await getShopById(invite.accountId);
  if (!account) return { success: false, error: "That store no longer exists." };

  const existingMembership = await db.query.accountMember.findFirst({
    where: and(
      eq(accountMember.userId, user.id),
      eq(accountMember.accountId, invite.accountId),
    ),
  });

  if (!existingMembership) {
    await db.insert(accountMember).values({
      userId: user.id,
      accountId: invite.accountId,
      roleId: invite.roleId,
    });
  }

  await db
    .update(invitation)
    .set({ status: "accepted" })
    .where(eq(invitation.id, invite.id));

  await db
    .update(appUser)
    .set({ onboardingCompletedAt: user.onboardingCompletedAt ?? new Date() })
    .where(eq(appUser.id, user.id));

  revalidatePath(`/${account.slug}/settings`);
  return { success: true, data: { accountSlug: account.slug } };
}

export async function revokeInvitation(
  accountId: string,
  invitationId: string,
): Promise<ActionResult> {
  const authResult = await requireShopPermission(accountId, "users.invite");
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db
    .update(invitation)
    .set({ status: "revoked" })
    .where(and(eq(invitation.id, invitationId), eq(invitation.accountId, accountId)));

  revalidatePath(`/${authResult.shop.slug}/settings`);
  return { success: true, data: undefined };
}

export async function removeMember(
  accountId: string,
  memberId: string,
): Promise<ActionResult> {
  const authResult = await requireShopPermission(accountId, "users.remove");
  if (!authResult.ok) return { success: false, error: authResult.error };

  const member = await db.query.accountMember.findFirst({
    where: and(eq(accountMember.id, memberId), eq(accountMember.accountId, accountId)),
    with: { role: { columns: { name: true } } },
  });
  if (!member) return { success: false, error: "Member not found." };
  if (member.role.name === "Owner") {
    return { success: false, error: "The owner can't be removed. Transfer ownership first." };
  }

  await db.delete(accountMember).where(eq(accountMember.id, memberId));

  revalidatePath(`/${authResult.shop.slug}/settings`);
  return { success: true, data: undefined };
}

export async function listPendingInvitations(accountId: string) {
  return db.query.invitation.findMany({
    where: and(eq(invitation.accountId, accountId), eq(invitation.status, "pending")),
    with: { role: { columns: { name: true } } },
  });
}

export async function listAccountMembers(accountId: string) {
  const members = await db.query.accountMember.findMany({
    where: eq(accountMember.accountId, accountId),
    with: {
      role: { columns: { name: true } },
      user: { columns: { id: true, name: true, email: true } },
    },
  });
  return members;
}
