// Curated to what Paystack (our payments provider) actually settles in.
// Add more here later if Paystack's supported-currency list grows — nothing
// else needs to change since shop.currency just stores the code.
export const CURRENCIES = [
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", name: "US Dollar", symbol: "$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const SYMBOL_BY_CODE: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol]),
);

export function getCurrencySymbol(code: string): string {
  return SYMBOL_BY_CODE[code] ?? code;
}
