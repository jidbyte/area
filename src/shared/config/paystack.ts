// The platform's commission, as a percentage_charge passed to Paystack when
// creating each shop's subaccount. Paystack's split mechanics (confirmed
// against their docs, not assumed):
//
//   - percentage_charge is what the MAIN ACCOUNT (us) receives, raw.
//   - By default, Paystack's own processing fee is deducted from the MAIN
//     ACCOUNT's share, not the subaccount's (we're not overriding `bearer`).
//
// So for a transaction of amount T, with percentage_charge = 2.5 and
// Paystack's Ghana rate of ~1.95%:
//   - Shop's subaccount receives 97.5% of T, untouched by Paystack's fee.
//   - Our main account's raw share is 2.5% of T, from which Paystack's own
//     ~1.95% fee is deducted, netting us ~0.55% of T.
//
// That's the intended economics: shops effectively pay 2.5% total, ~1.95 of
// which is Paystack's actual processing cost and ~0.55 is our margin — not
// 2.5% on top of Paystack's cut. Stored in basis points (250 = 2.5%) to
// match shop.commissionRate's existing convention.
export const PLATFORM_COMMISSION_BPS = 250;

// Paystack's /bank endpoint wants a country name, not a currency code.
// Subaccounts/split payments are a core feature across Paystack's supported
// countries, but this mapping (and Paystack's actual coverage) is worth
// re-confirming once real bank onboarding is tested — USD has no natural
// "local bank" country in Paystack's model, so it falls back to Ghana here.
const CURRENCY_TO_PAYSTACK_COUNTRY: Record<string, string> = {
  GHS: "ghana",
  NGN: "nigeria",
  ZAR: "south africa",
  KES: "kenya",
  USD: "ghana",
};

export function paystackCountryForCurrency(currency: string): string {
  return CURRENCY_TO_PAYSTACK_COUNTRY[currency] ?? "ghana";
}
