import { z } from "zod";

import { isReservedSlug } from "@/config/reserved-slugs";

export const shopSlugSchema = z
  .string()
  .min(3, "Must be at least 3 characters")
  .max(40, "Must be 40 characters or fewer")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
  .refine((slug) => !isReservedSlug(slug), {
    message: "That name is reserved — please choose another",
  });

export const createShopSchema = z.object({
  name: z.string().min(2, "Required").max(80),
  slug: shopSlugSchema,
  description: z.string().max(500).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contact: z.string().max(40).optional().or(z.literal("")),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
