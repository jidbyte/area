"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";

import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { updateNotificationPreferences } from "@/features/app/stores/server/actions";

export function NotificationPreferencesForm({
  shopId,
  defaultValues,
}: {
  shopId: string;
  defaultValues: { emailNotificationsEnabled: boolean; whatsappNotificationsEnabled: boolean };
}) {
  const [email, setEmail] = useState(defaultValues.emailNotificationsEnabled);
  const [whatsapp, setWhatsapp] = useState(defaultValues.whatsappNotificationsEnabled);
  const [isPending, startTransition] = useActionTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateNotificationPreferences(shopId, {
        emailNotificationsEnabled: email,
        whatsappNotificationsEnabled: whatsapp,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-start gap-3">
        <Checkbox id="email-notif" checked={email} onCheckedChange={(v) => setEmail(!!v)} />
        <label htmlFor="email-notif" className="text-sm">
          <span className="font-medium text-ink">Email notifications</span>
          <p className="text-neutral">
            Order confirmations and new-order alerts sent by email, to buyers and to you.
          </p>
        </label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id="whatsapp-notif" checked={whatsapp} onCheckedChange={(v) => setWhatsapp(!!v)} />
        <label htmlFor="whatsapp-notif" className="text-sm">
          <span className="font-medium text-ink">WhatsApp notifications</span>
          <p className="text-neutral">
            Order confirmations and new-order alerts sent by WhatsApp, to buyers and to you.
          </p>
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-success">Saved.</p>}

      <Button onClick={handleSave} disabled={isPending} loading={isPending}>
        {isPending ? "Saving..." : "Save preferences"}
      </Button>
    </div>
  );
}
