import { getCurrencySymbol } from "@/shared/config/currencies";

/** Formats a whole-number price (see the inventory schema's note on units) with the shop's currency symbol. */
export function formatPrice(amount: number, currencyCode: string): string {
  return `${getCurrencySymbol(currencyCode)}${amount.toLocaleString()}`;
}
