// Run with: npm run db:seed
// Idempotent — safe to re-run (upserts by unique key).
import "dotenv/config";
import { eq } from "drizzle-orm";

import { db } from "./index";
import {
  role,
  permission,
  rolePermission,
  PERMISSION_KEYS,
  ROLE_PERMISSIONS,
} from "./schema/users";

async function main() {
  console.log("Seeding roles and permissions...");

  const permissionIdByKey = new Map<string, string>();
  for (const key of PERMISSION_KEYS) {
    const existing = await db.query.permission.findFirst({
      where: eq(permission.key, key),
    });
    const row =
      existing ??
      (await db.insert(permission).values({ key }).returning())[0];
    permissionIdByKey.set(key, row.id);
  }

  const roleIdByName = new Map<string, string>();
  for (const name of Object.keys(ROLE_PERMISSIONS) as Array<
    keyof typeof ROLE_PERMISSIONS
  >) {
    const existing = await db.query.role.findFirst({
      where: eq(role.name, name),
    });
    const row =
      existing ?? (await db.insert(role).values({ name }).returning())[0];
    roleIdByName.set(name, row.id);
  }

  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByName.get(roleName)!;
    for (const key of keys) {
      const permissionId = permissionIdByKey.get(key)!;
      await db
        .insert(rolePermission)
        .values({ roleId, permissionId })
        .onConflictDoNothing();
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
