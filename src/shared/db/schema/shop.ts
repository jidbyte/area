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
// terms — the SQL table itself is literally named "organization" below,
// even though the exported TS symbol stays `shop` to avoid a
// codebase-wide rename with no functional benefit). There is no
// approval/curation workflow anymore — a shop exists the moment its owner
// completes /setup, and only goes away if they delete it (soft delete via
// deletedAt). This is an application-level rule (Clerk itself doesn't cap
// org membership at one) — enforced by /setup checking for an existing
// membership before ever creating another organization.
export const shop = pgTable(
  "organization",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Clerk Organization id — the shop IS a Clerk org; this is the join point.
    // No longer required — account membership/roles now live in our own
    // account_member/role tables (see schema/users.ts) rather than Clerk
    // Organizations, which required an extra paid-feature toggle in the
    // Clerk dashboard. Kept as an optional column in case a shop was
    // created under the old flow, or Clerk orgs are reintroduced later for
    // their own dashboard/UI conveniences.
    clerkOrgId: text("clerk_org_id").unique(),
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
    // Store-level toggles for the Settings -> Notifications tab. Order
    // notifications (sendOrderNotifications) check these before sending;
    // per-buyer preferences aren't modeled — this is a store-wide switch.
    emailNotificationsEnabled: boolean("email_notifications_enabled").notNull().default(true),
    whatsappNotificationsEnabled: boolean("whatsapp_notifications_enabled").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("organization_slug_idx").on(table.slug)],
);

export const shopRelations = relations(shop, () => ({}));
