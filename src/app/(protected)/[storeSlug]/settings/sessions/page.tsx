import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { listMySessions } from "@/features/app/auth/server/sessions";
import { SessionsList } from "@/features/admin/shared/client/sessions-list";

export default async function SessionsSettingsPage() {
  const sessions = await listMySessions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-neutral">
          Devices currently signed in to your account. Revoking a session signs
          that device out immediately.
        </p>
        <SessionsList sessions={sessions} />
      </CardContent>
    </Card>
  );
}
