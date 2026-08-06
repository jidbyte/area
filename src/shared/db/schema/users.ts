import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

import { shop, timestamps } from "./shop";

// Local mirror of the Clerk user, keyed by Clerk's user id. We need our own
// row (rather than trusting Clerk alone) because `accountType` and account
// membership are app-level concepts Clerk doesn't model.
//
// accountType is a UX default, not an access-control boundary — a "buyer"
// who later creates a store becomes a business owner via account_member,
// and a "business" user can still shop on other stores (see spec: "business
// accounts can also go to /shop/[userId] and make purchases from other
// businesses too"). Never gate authorization on accountType; always check
// account_member + role_permission for that.
export const appUser = pgTable(
  "app_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    accountType: text("account_type", { enum: ["buyer", "business"] })
      .notNull()
      .default("buyer"),
    name: text("name"),
    email: text("email"),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    ...timestamps,
  },
  (table) => [index("appUser_clerkUserId_idx").on(table.clerkUserId)],
);

// Fixed v1 role set. Schema supports custom roles later (roles aren't
// hardcoded to an enum), but only these four ship in the UI for now.
export const role = pgTable(
  "role",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name", { enum: ["Owner", "Admin", "Editor", "Viewer"] })
      .notNull()
      .unique(),
    description: text("description"),
    ...timestamps,
  },
);

// Permission keys are plain strings ("products.update") rather than an enum
// so new permissions can be added without a migration touching every
// existing row — only role_permission rows need inserting for a new grant.
export const permission = pgTable(
  "permission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull().unique(),
    description: text("description"),
    ...timestamps,
  },
);

export const rolePermission = pgTable(
  "role_permission",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("rolePermission_roleId_idx").on(table.roleId),
  ],
);

// The membership join: one user can belong to many stores (accounts) with a
// different role in each — same shape as GitHub org membership / Notion
// workspace membership. This is the row `can()` looks up.
export const accountMember = pgTable(
  "account_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => appUser.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    index("accountMember_userId_idx").on(table.userId),
    index("accountMember_accountId_idx").on(table.accountId),
    unique("accountMember_user_account_unique").on(
      table.userId,
      table.accountId,
    ),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => shop.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "restrict" }),
    token: text("token").notNull().unique(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => appUser.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "revoked", "expired"],
    })
      .notNull()
      .default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    ...timestamps,
  },
  (table) => [
    index("invitation_accountId_idx").on(table.accountId),
    index("invitation_email_idx").on(table.email),
    index("invitation_token_idx").on(table.token),
  ],
);

export const appUserRelations = relations(appUser, ({ many }) => ({
  memberships: many(accountMember),
}));

export const roleRelations = relations(role, ({ many }) => ({
  rolePermissions: many(rolePermission),
  memberships: many(accountMember),
}));

export const permissionRelations = relations(permission, ({ many }) => ({
  rolePermissions: many(rolePermission),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  role: one(role, { fields: [rolePermission.roleId], references: [role.id] }),
  permission: one(permission, {
    fields: [rolePermission.permissionId],
    references: [permission.id],
  }),
}));

export const accountMemberRelations = relations(accountMember, ({ one }) => ({
  user: one(appUser, {
    fields: [accountMember.userId],
    references: [appUser.id],
  }),
  account: one(shop, {
    fields: [accountMember.accountId],
    references: [shop.id],
  }),
  role: one(role, {
    fields: [accountMember.roleId],
    references: [role.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  account: one(shop, {
    fields: [invitation.accountId],
    references: [shop.id],
  }),
  role: one(role, { fields: [invitation.roleId], references: [role.id] }),
  invitedBy: one(appUser, {
    fields: [invitation.invitedByUserId],
    references: [appUser.id],
  }),
}));

// Seed data for `db:seed` — the fixed v1 role/permission matrix from spec.
export const PERMISSION_KEYS = [
  "products.read",
  "products.create",
  "products.update",
  "products.delete",
  "orders.manage",
  "users.invite",
  "users.remove",
  "billing.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ROLE_PERMISSIONS: Record<
  "Owner" | "Admin" | "Editor" | "Viewer",
  PermissionKey[]
> = {
  Owner: [...PERMISSION_KEYS],
  Admin: PERMISSION_KEYS.filter((k) => k !== "billing.manage"),
  Editor: [
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "orders.manage",
  ],
  Viewer: ["products.read"],
};
