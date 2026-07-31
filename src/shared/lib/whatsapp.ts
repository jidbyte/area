import { createHmac } from "crypto";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

/**
 * Sends an approved WhatsApp message template. This is the only message
 * type Meta allows for business-initiated contact outside an active
 * 24-hour customer-service window — a proactive order notification always
 * falls outside that window, so free-form text isn't an option here.
 */
export async function sendWhatsAppTemplate(params: {
  /** Already normalized — no leading "+", full international format (see shared/utils/phone.ts). */
  to: string;
  templateName: string;
  languageCode: string;
  bodyParams: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const accessToken = requiredEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
  // Confirmed against Meta's own current Get Started example, which uses
  // v23.0 — bump this again once it moves on, which Meta does every few
  // months.
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";

  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to,
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.languageCode },
          components: [
            {
              type: "body",
              parameters: params.bodyParams.map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      }),
    },
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error?.message ?? `WhatsApp request failed (${res.status}).`,
    };
  }
  return { ok: true };
}

/**
 * Meta signs every webhook payload (delivery-status updates, inbound
 * messages, template approval changes, etc.) with HMAC-SHA256 over the raw
 * body using your app's App Secret — a different credential from the
 * access token used to send messages. Same principle as Paystack's webhook
 * verification: must be computed over the exact raw bytes, not a
 * JSON.parse/stringify round trip.
 */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const appSecret = requiredEnv("META_APP_SECRET");
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return expected === signatureHeader;
}
