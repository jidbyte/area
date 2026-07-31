import { NextRequest, NextResponse } from "next/server";

import { verifyWebhookSignature } from "@/shared/lib/paystack";
import { completeSaleFromPaystackReference } from "@/features/checkout/server/actions";

export async function POST(req: NextRequest) {
  // Must read as raw text FIRST — the signature is computed over the exact
  // bytes Paystack sent, not a JSON.parse/stringify round trip of them.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      const result = await completeSaleFromPaystackReference(reference);
      if (!result.success) {
        console.error("[webhooks/paystack] completion failed:", result.error);
        // Non-200 so Paystack retries — this could be a transient DB error,
        // not necessarily a reason to give up on this event.
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
