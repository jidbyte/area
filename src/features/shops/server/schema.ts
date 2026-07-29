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

export type SetupInput = z.infer<typeof setupSchema>;
