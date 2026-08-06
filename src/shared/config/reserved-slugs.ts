// Slugs a store is NOT allowed to register, because they'd collide with a
// platform-level route (e.g. a store named "stores" would shadow /stores).
export const RESERVED_SLUGS = [
  "admin",
  "setup",
  "onboarding",
  "invite",
  "api",
  "auth",
  "cart",
  "checkout",
  "sign-in",
  "sign-up",
  "sign-out",
  "about",
  "contact",
  "pricing",
  "blog",
  "help",
  "terms",
  "privacy",
  "shop",
  "shops",
  "stores",
  "order",
  "dashboard",
  "products",
  "sales",
  "purchases",
  "customers",
  "suppliers",
  "reviews",
  "analytics",
  "settings",
  "_next",
  "static",
  "favicon.ico",
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase());
}
