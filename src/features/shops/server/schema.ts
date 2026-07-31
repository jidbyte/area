import { z } from "zod";

import { isReservedSlug } from "@/shared/config/reserved-slugs";
import { CURRENCIES } from "@/shared/config/currencies";

export const shopSlugSchema = z
  .string()
  .min(3, "Must be at least 3 characters")
  .max(40, "Must be 40 characters or fewer")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
  .refine((slug) => !isReservedSlug(slug), {
    message: "That name is reserved — please choose another",
  });

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];

// The entire first-run setup form: organization name, its public URL slug,
// and the currency its buyers will see. Everything else (description,
// address, contact info, logo) is a later "shop settings" concern, not part
// of getting a new shop off the ground.
export const setupSchema = z.object({
  name: z.string().min(2, "Required").max(80),
  slug: shopSlugSchema,
  currency: z.enum(currencyCodes, { message: "Choose a currency" }),
});

export const shopSettingsSchema = z.object({
  name: z.string().min(2, "Required").max(80, "Keep it under 80 characters"),
  description: z.string().max(1000).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  email: z
    .email({ message: "Enter a valid email" })
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

export const paystackSetupSchema = z.object({
  bankCode: z.string().min(1, "Choose a bank"),
  accountNumber: z.string().min(4, "Required").max(20),
});


export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
export type PaystackSetupInput = z.infer<typeof paystackSetupSchema>;
