import { relations } from "drizzle-orm";
import { pgTable, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// Carried over from GoCart's `Store` model, adapted for a Clerk-Organization-backed
// multi-vendor shop instead of a single owning userId.
export const shop = pgTable(
  "shop",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Clerk Organization id — the shop IS a Clerk org; this is the join point.
    clerkOrgId: text("clerk_org_id").notNull().unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(), // was "username" in GoCart
    description: text("description"),
    address: text("address"),
    logo: text("logo"),
    email: text("email"),
    contact: text("contact"),
    status: text("status", { enum: ["pending", "approved", "suspended"] })
      .notNull()
      .default("pending"),
    isActive: boolean("is_active").notNull().default(false),
    // Multi-vendor additions (not in GoCart's single-tenant Store model)
    commissionRate: integer("commission_rate").notNull().default(0), // basis points
    paystackSubaccountCode: text("paystack_subaccount_code"),
    ...timestamps,
  },
  (table) => [
    index("shop_slug_idx").on(table.slug),
    index("shop_status_idx").on(table.status),
  ],
);

export const shopRelations = relations(shop, () => ({}));
