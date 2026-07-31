import { relations } from "drizzle-orm";
import { pgTable, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// One Clerk account -> at most one shop (an "organization" in account-model
// terms). There is no approval/curation workflow anymore — a shop exists
// the moment its owner completes /setup, and only goes away if they delete
// it (soft delete via deletedAt). This is an application-level rule (Clerk
// itself doesn't cap org membership at one) — enforced by /setup checking
// for an existing membership before ever creating another organization.
export const shop = pgTable(
  "shop",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Clerk Organization id — the shop IS a Clerk org; this is the join point.
    clerkOrgId: text("clerk_org_id").notNull().unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    address: text("address"),
    logo: text("logo"),
    email: text("email"),
    phone: text("phone"),
    // ISO 4217 code (e.g. "GHS", "NGN", "USD") — see shared/config/currencies.ts
    currency: text("currency").notNull().default("USD"),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at"),
    commissionRate: integer("commission_rate").notNull().default(250), // basis points; 250 = 2.5%
    paystackSubaccountCode: text("paystack_subaccount_code"),
    ...timestamps,
  },
  (table) => [index("shop_slug_idx").on(table.slug)],
);

export const shopRelations = relations(shop, () => ({}));
