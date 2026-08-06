import { createHmac } from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const secretKey = requiredEnv("PAYSTACK_SECRET_KEY");

  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.status) {
    return {
      ok: false,
      error: json?.message ?? `Paystack request failed (${res.status}).`,
    };
  }
  return { ok: true, data: json.data as T };
}

export type PaystackBank = { name: string; code: string; slug: string };

export async function listBanks(country: string, currency: string) {
  return paystackFetch<PaystackBank[]>(
    `/bank?country=${encodeURIComponent(country)}&currency=${encodeURIComponent(currency)}`,
  );
}

export type PaystackSubaccount = {
  subaccount_code: string;
  account_name: string;
};

export async function createSubaccount(params: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge: number;
}) {
  return paystackFetch<PaystackSubaccount>("/subaccount", {
    method: "POST",
    body: JSON.stringify({
      business_name: params.businessName,
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge,
    }),
  });
}

export async function updateSubaccount(
  subaccountCode: string,
  params: {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge: number;
  },
) {
  return paystackFetch<PaystackSubaccount>(`/subaccount/${subaccountCode}`, {
    method: "PUT",
    body: JSON.stringify({
      business_name: params.businessName,
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge,
    }),
  });
}

export type PaystackCheckoutMetadata = {
  shopId: string;
  cartId: string;
  buyerClerkUserId: string | null;
  customerInput: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
  }>;
  couponId: string | null;
  discountAmount: number;
};

export type PaystackInitializeResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export async function initializeTransaction(params: {
  email: string;
  amountInWholeCurrency: number;
  currency: string;
  subaccountCode: string;
  callbackUrl: string;
  metadata: PaystackCheckoutMetadata;
}) {
  return paystackFetch<PaystackInitializeResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      // Paystack expects amounts in the smallest currency unit (pesewas,
      // kobo, cents) — our prices are stored as whole currency units
      // throughout, hence x100.
      amount: Math.round(params.amountInWholeCurrency * 100),
      currency: params.currency,
      subaccount: params.subaccountCode,
      callback_url: params.callbackUrl,
      // Paystack's own docs describe this field as a "Stringified JSON
      // object" — it wants the STRING, not a nested object. Passing a raw
      // object here (even though it's valid JSON once the outer body is
      // stringified) doesn't round-trip cleanly through their metadata
      // storage — this was the root cause of a real bug where reconstructed
      // sale data failed validation on the way back out of verify.
      metadata: JSON.stringify(params.metadata),
    }),
  });
}

export type PaystackVerifyResult = {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amount: number;
  currency: string;
  metadata: unknown;
};

export async function verifyTransaction(reference: string) {
  return paystackFetch<PaystackVerifyResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export function parsePaystackMetadata(
  raw: unknown,
): PaystackCheckoutMetadata | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as PaystackCheckoutMetadata;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as PaystackCheckoutMetadata;
    } catch {
      return null;
    }
  }
  return null;
}

/** HMAC-SHA512 of the raw request body using the secret key — must be computed over the raw bytes, not a re-serialized JSON.parse/stringify round trip. */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const secretKey = requiredEnv("PAYSTACK_SECRET_KEY");
  const hash = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  return hash === signatureHeader;
}
