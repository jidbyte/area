import { Resend } from "resend";

let client: Resend | null = null;

/** Lazily constructed so a missing RESEND_API_KEY only breaks email sending, not module import. */
export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not set. Copy .env.example to .env and fill it in.",
      );
    }
    client = new Resend(apiKey);
  }
  return client;
}

/**
 * Resend requires the address portion to be on a domain you've verified,
 * but the DISPLAY NAME can be dynamic — this is what lets a buyer see
 * "Nexus Gadgets via AREA" instead of a generic platform-only sender.
 */
export function fromAddressForShop(shopName: string): string {
  const address = process.env.RESEND_FROM_EMAIL || "orders@resend.dev";
  return `${shopName} via AREA <${address}>`;
}
