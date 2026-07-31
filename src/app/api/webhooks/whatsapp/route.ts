import { NextRequest, NextResponse } from "next/server";

import { verifyWhatsAppWebhookSignature } from "@/shared/lib/whatsapp";

/**
 * Meta requires this handshake before it will let you save a webhook URL in
 * the dashboard at all: it sends hub.mode/hub.verify_token/hub.challenge as
 * query params, and expects the raw challenge string echoed back if
 * hub.verify_token matches the secret you configured (both here and in
 * Meta's webhook settings).
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Logging-only for now — no persistence, no schema change. This is
  // visibility into whether our order notifications actually reached
  // someone (delivered/read/failed) or bounced, which the synchronous send
  // response alone can't tell us. Wiring this into a persisted delivery
  // status would be a reasonable next step if silent WhatsApp failures
  // become a real problem worth tracking properly.
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      for (const status of value.statuses ?? []) {
        console.log(
          `[webhooks/whatsapp] message ${status.id} to ${status.recipient_id}: ${status.status}`,
          status.errors ? { errors: status.errors } : "",
        );
      }

      for (const message of value.messages ?? []) {
        // Someone replied to a notification — we don't have anywhere for a
        // human to see this yet (no inbox UI), so just log it rather than
        // silently dropping it.
        console.log(
          `[webhooks/whatsapp] inbound message from ${message.from}:`,
          message.text?.body ?? `(${message.type})`,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
