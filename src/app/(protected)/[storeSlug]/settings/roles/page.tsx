import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopBySlug } from "@/features/app/stores/server/queries";
import {
  listAccountMembers,
  listPendingInvitations,
} from "@/features/app/stores/server/invitations";
import { InviteMemberDialog } from "@/features/admin/shared/client/invite-member-dialog";
import { MembersList } from "@/features/admin/shared/client/members-list";

export default async function RolesSettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const [members, invitations] = await Promise.all([
    listAccountMembers(shop.id),
    listPendingInvitations(shop.id),
  ]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Team &amp; roles</CardTitle>
        <InviteMemberDialog shopId={shop.id} />
      </CardHeader>
      <CardContent>
        <MembersList
          shopId={shop.id}
          members={members.map((m) => ({
            id: m.id,
            role: m.role.name,
            user: { id: m.user.id, name: m.user.name, email: m.user.email },
          }))}
          invitations={invitations.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role.name,
            expiresAt: i.expiresAt,
          }))}
        />
      </CardContent>
    </Card>
  );
}
