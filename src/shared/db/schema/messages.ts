import { relations } from "drizzle-orm";
import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";

// A message can target a specific store (sent from that store's public page)
// or the platform generally (sent from the homepage/contact page) — shopId
// is nullable to cover the platform-wide case.
export const message = pgTable(
  "message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shopId: text("organization_id").references(() => shop.id, {
      onDelete: "cascade",
    }),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    emailedAt: timestamp("emailed_at"),
    ...timestamps,
  },
  (table) => [
    index("message_organizationId_idx").on(table.shopId),
    index("message_isRead_idx").on(table.isRead),
  ],
);

export const messageRelations = relations(message, ({ one }) => ({
  shop: one(shop, { fields: [message.shopId], references: [shop.id] }),
}));
