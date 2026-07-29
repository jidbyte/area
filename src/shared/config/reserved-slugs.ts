// Slugs a shop is NOT allowed to register, because they'd collide with a
// platform-level route (e.g. a shop named "admin" would shadow /admin).
export const RESERVED_SLUGS = [
  "admin",
  "setup",
  "api",
  "auth",
  "cart",
  "checkout",
  "sign-in",
  "sign-up",
  "sign-out",
  "about",
  "pricing",
  "blog",
  "help",
  "terms",
  "privacy",
  "shops",
  "order",
  "_next",
  "static",
  "favicon.ico",
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase());
}
