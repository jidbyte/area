"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

export type SessionRow = {
  id: string;
  isCurrent: boolean;
  status: string;
  lastActiveAt: number;
  createdAt: number;
  deviceType: string | null;
  browserName: string | null;
  city: string | null;
  country: string | null;
};

export async function listMySessions(): Promise<SessionRow[]> {
  const { userId, sessionId: currentSessionId } = await auth();
  if (!userId) return [];

  const client = await clerkClient();
  const { data } = await client.sessions.getSessionList({ userId, status: "active" });

  return data.map((s) => ({
    id: s.id,
    isCurrent: s.id === currentSessionId,
    status: s.status,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    deviceType: s.latestActivity?.deviceType ?? null,
    browserName: s.latestActivity?.browserName ?? null,
    city: s.latestActivity?.city ?? null,
    country: s.latestActivity?.country ?? null,
  }));
}

/**
 * Revokes any of the signed-in user's OWN sessions — never someone else's.
 * The session-ownership check (fetching it and comparing userId) prevents
 * a signed-in user from passing an arbitrary sessionId and revoking
 * another account's session.
 */
export async function revokeMySession(sessionId: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "You must be signed in." };

  const client = await clerkClient();
  const session = await client.sessions.getSession(sessionId);
  if (session.userId !== userId) {
    return { success: false, error: "You don't have access to that session." };
  }

  await client.sessions.revokeSession(sessionId);
  return { success: true, data: undefined };
}
