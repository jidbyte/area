import { relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";

// General business expenditure NOT tied to a purchase order — taxes, bills,
// salaries, rent, etc. (Purchases already cover stock/inventory spend; this
// is everything else.)
export const expense = pgTable(
  "expense",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["tax", "bills", "salaries", "rent", "marketing", "other"],
    })
      .notNull()
      .default("other"),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    expenseDate: timestamp("expense_date").notNull(),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("expense_organizationId_idx").on(table.shopId),
    index("expense_expenseDate_idx").on(table.expenseDate),
    index("expense_category_idx").on(table.category),
  ],
);

// Revenue that doesn't come from a direct sale — e.g. a service fee,
// affiliate payout, refund received, one-off consulting income.
export const income = pgTable(
  "income",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    description: text("description"),
    amount: integer("amount").notNull(),
    incomeDate: timestamp("income_date").notNull(),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("income_organizationId_idx").on(table.shopId),
    index("income_incomeDate_idx").on(table.incomeDate),
  ],
);

export const expenseRelations = relations(expense, ({ one }) => ({
  shop: one(shop, { fields: [expense.shopId], references: [shop.id] }),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  shop: one(shop, { fields: [income.shopId], references: [shop.id] }),
}));
