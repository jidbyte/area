"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { revokeMySession, type SessionRow } from "@/features/app/auth/server/sessions";

export function SessionsList({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useActionTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRevoke(sessionId: string) {
    setError(null);
    setPendingId(sessionId);
    startTransition(async () => {
      const result = await revokeMySession(sessionId);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-neutral">No active sessions found.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const Icon = s.deviceType && /mobile|phone/i.test(s.deviceType) ? Smartphone : Monitor;
        const location = [s.city, s.country].filter(Boolean).join(", ");
        return (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-md border border-muted/40 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <Icon className="size-4 text-neutral" />
              <div>
                <p className="text-ink">
                  {s.browserName ?? "Unknown browser"}
                  {s.isCurrent && (
                    <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs text-neutral">
                  {location || "Unknown location"} — last active{" "}
                  {new Date(s.lastActiveAt).toLocaleString()}
                </p>
              </div>
            </div>
            {!s.isCurrent && (
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending && pendingId === s.id} loading={isPending && pendingId === s.id}
                onClick={() => handleRevoke(s.id)}
                aria-label="Revoke session"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        );
      })}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
