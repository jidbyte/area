import { currentUser } from "@clerk/nextjs/server";

/**
 * Platform super-admin — not tied to any shop/organization. Checked via a
 * flag on the Clerk user's publicMetadata (see src/types/clerk.d.ts).
 *
 * Bootstrapping: there's no UI to grant the very first admin (that would be
 * circular). Set `publicMetadata.platformRole = "admin"` on your own user
 * once, manually, in the Clerk Dashboard. Every admin after that can be
 * granted through the platform admin UI.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const user = await currentUser();
  return user?.publicMetadata?.platformRole === "admin";
}
