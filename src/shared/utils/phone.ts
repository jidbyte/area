import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const CURRENCY_TO_COUNTRY_CODE: Record<string, CountryCode> = {
  GHS: "GH",
  NGN: "NG",
  ZAR: "ZA",
  KES: "KE",
  USD: "GH",
};

export function countryCodeForCurrency(currency: string): CountryCode {
  return CURRENCY_TO_COUNTRY_CODE[currency] ?? "GH";
}

/**
 * WhatsApp's Cloud API wants the recipient number in international format
 * with no leading "+". Our stored phone numbers are free-text from forms
 * (checkout, shop settings) — could be "0241234567", "+233241234567",
 * "233 24 123 4567", anything a person typed — so this needs a real parser,
 * not a regex. Returns null (rather than a best-effort guess) for anything
 * that doesn't parse to a valid number, so callers can skip sending and log
 * it instead of firing a message at a garbled destination.
 */
export function normalizePhoneForWhatsApp(
  raw: string,
  currency: string,
): string | null {
  const defaultCountry = countryCodeForCurrency(currency);
  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number.replace(/^\+/, "");
}
