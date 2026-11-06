import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { runMigrations } from "./migrate";
import { createTestDb, testDatabaseUrl } from "./testing";

const { db, close } = createTestDb();
afterAll(close);

async function scalar<T>(query: ReturnType<typeof sql>): Promise<T> {
  const result = await db.execute<{ value: T }>(query);
  return result.rows[0]!.value;
}

describe("migrations", () => {
  it("are a no-op when applied again", async () => {
    const before = await scalar<number>(
      sql`select count(*)::int as value from drizzle.__drizzle_migrations`,
    );
    await runMigrations(testDatabaseUrl());
    const after = await scalar<number>(
      sql`select count(*)::int as value from drizzle.__drizzle_migrations`,
    );
    expect(after).toBe(before);
  });

  it("create app.outbox_events with RLS enabled and forced", async () => {
    const result = await db.execute<{
      enabled: boolean;
      forced: boolean;
    }>(sql`
      select relrowsecurity as enabled, relforcerowsecurity as forced
      from pg_class
      where oid = 'app.outbox_events'::regclass
    `);
    expect(result.rows).toEqual([{ enabled: true, forced: true }]);
  });

  it.each(["anon", "authenticated", "public"])(
    "give %s no access to schema app",
    async (role) => {
      const usage = await scalar<boolean>(
        role === "public"
          ? sql`select bool_or(acl.privilege_type = 'USAGE') is true as value
                from pg_namespace n, aclexplode(n.nspacl) acl
                where n.nspname = 'app' and acl.grantee = 0`
          : sql`select has_schema_privilege(${role}, 'app', 'USAGE') as value`,
      );
      expect(usage).toBe(false);
    },
  );
});
