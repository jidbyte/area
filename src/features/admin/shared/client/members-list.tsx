"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { revokeInvitation, removeMember } from "@/features/app/stores/server/invitations";

export type MemberRow = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
};

export type PendingInvitationRow = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
};

export function MembersList({
  shopId,
  members,
  invitations,
}: {
  shopId: string;
  members: MemberRow[];
  invitations: PendingInvitationRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRemoveMember(memberId: string) {
    setError(null);
    setPendingId(memberId);
    startTransition(async () => {
      const result = await removeMember(shopId, memberId);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function handleRevokeInvitation(invitationId: string) {
    setError(null);
    setPendingId(invitationId);
    startTransition(async () => {
      await revokeInvitation(shopId, invitationId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Members</h3>
        {members.length === 0 ? (
          <p className="text-sm text-neutral">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-md border border-muted/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-ink">{m.user.name || m.user.email || "Unnamed"}</p>
                  {m.user.name && <p className="text-xs text-neutral">{m.user.email}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral">{m.role}</span>
                  {m.role !== "Owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending && pendingId === m.id} loading={isPending && pendingId === m.id}
                      onClick={() => handleRemoveMember(m.id)}
                      aria-label="Remove member"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">Pending invitations</h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-md border border-dashed border-muted/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-ink">{inv.email}</p>
                  <p className="text-xs text-neutral">
                    Expires {inv.expiresAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral">{inv.role}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending && pendingId === inv.id} loading={isPending && pendingId === inv.id}
                    onClick={() => handleRevokeInvitation(inv.id)}
                    aria-label="Revoke invitation"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
