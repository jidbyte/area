import { clerkClient } from "@clerk/nextjs/server";

export async function isMemberOfShopOrg(
  userId: string,
  clerkOrgId: string,
): Promise<boolean> {
  const client = await clerkClient();
  const { data: memberships } =
    await client.users.getOrganizationMembershipList({ userId });
  return memberships.some((m) => m.organization.id === clerkOrgId);
}
