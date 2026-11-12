import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { createDb } from "./client";
import { LOCAL_API_ROLE_PASSWORD } from "./env";
import {
  asPlatform,
  asTenant,
  createTestDb,
  INSUFFICIENT_PRIVILEGE,
  inRollback,
  NON_TENANT_TABLES,
  pgErrorCode,
  seedTwoTenants,
  TENANT_TABLES,
  testDatabaseUrl,
  type TenantTable,
} from "./testing";
import type { Tx } from "./transaction";

// The cross-tenant isolation harness at the database level (ADR-0005,
// ADR-0022). F-AUTH-RBAC adds the per-endpoint suite on the same helpers.

const { db, close } = createTestDb();
afterAll(close);

const DENIED = "denied" as const;

/** Runs a query; a privilege error becomes DENIED, anything else is rethrown. */
async function attempt<T>(query: () => Promise<T>): Promise<T | typeof DENIED> {
  try {
    return await query();
  } catch (error) {
    if (pgErrorCode(error) === INSUFFICIENT_PRIVILEGE) return DENIED;
    throw error;
  }
}

const target = (table: TenantTable) => sql`app.${sql.identifier(table.table)}`;

function tenantIds(sp: Tx, table: TenantTable) {
  return attempt(async () => {
    const { rows } = await sp.execute<{ tenant: string }>(
      sql`select ${sql.identifier(table.tenantColumn)}::text as tenant from ${target(table)}`,
    );
    return rows.map((row) => row.tenant);
  });
}

describe.each(TENANT_TABLES)("isolation of app.$table", (table) => {
  it("shows a tenant only its own rows", async () => {
    await inRollback(db, async (tx) => {
      const { a } = await seedTwoTenants(tx);
      const seen = await asTenant(tx, a.orgId, (sp) => tenantIds(sp, table));
      if (seen !== DENIED) {
        expect(seen.length).toBeGreaterThan(0);
        expect(new Set(seen)).toEqual(new Set([a.orgId]));
      }
    });
  });

  it("shows nothing without a tenant context", async () => {
    await inRollback(db, async (tx) => {
      await seedTwoTenants(tx);
      const seen = await asTenant(tx, null, (sp) => tenantIds(sp, table));
      expect(seen === DENIED || seen.length === 0).toBe(true);
    });
  });

  it("rejects a row for another tenant", async () => {
    await inRollback(db, async (tx) => {
      const { a, b } = await seedTwoTenants(tx);
      const values = table.newRow(b);
      const columns = Object.keys(values).map((name) => sql.identifier(name));
      const result = await asTenant(tx, a.orgId, (sp) =>
        attempt(() =>
          sp.execute(
            sql`insert into ${target(table)} (${sql.join(columns, sql`, `)})
                values (${sql.join(
                  Object.values(values).map((value) => sql`${value}`),
                  sql`, `,
                )})`,
          ),
        ),
      );
      expect(result).toBe(DENIED);
    });
  });

  it("changes none of another tenant's rows", async () => {
    await inRollback(db, async (tx) => {
      const { a, b } = await seedTwoTenants(tx);
      const column = sql.identifier(table.touchColumn);
      const result = await asTenant(tx, a.orgId, (sp) =>
        attempt(() =>
          sp.execute(
            sql`update ${target(table)} set ${column} = ${column}
                where ${sql.identifier(table.tenantColumn)} = ${b.orgId}`,
          ),
        ),
      );
      if (result !== DENIED) expect(result.rowCount).toBe(0);
    });
  });

  it.each(["anon", "authenticated"])("gives %s no access", async (role) => {
    const { rows } = await db.execute<{ allowed: boolean }>(
      sql`select has_table_privilege(${role}, ${`app.${table.table}`},
            'select, insert, update, delete') as allowed`,
    );
    expect(rows).toEqual([{ allowed: false }]);
  });
});

describe("the platform role", () => {
  it("sees every tenant's organizations and venues", async () => {
    await inRollback(db, async (tx) => {
      const { a, b } = await seedTwoTenants(tx);
      const seen = await asPlatform(tx, async (sp) => {
        const { rows } = await sp.execute<{ org: string }>(
          sql`select o.id::text as org from app.organizations o
              join app.venues v on v.org_id = o.id
              where o.id in (${a.orgId}, ${b.orgId})`,
        );
        return rows.map((row) => row.org);
      });
      expect(new Set(seen)).toEqual(new Set([a.orgId, b.orgId]));
    });
  });
});

describe("the runtime role notqueue_api", () => {
  const url = new URL(testDatabaseUrl());
  url.username = "notqueue_api";
  url.password = LOCAL_API_ROLE_PASSWORD;
  const api = createDb(url.toString(), 1);
  afterAll(() => api.pool.end());

  it.each(TENANT_TABLES)(
    "can't read app.$table without switching role",
    async (table) => {
      const result = await attempt(() =>
        api.db.execute(sql`select 1 from ${target(table)} limit 1`),
      );
      expect(result).toBe(DENIED);
    },
  );
});

describe("the catalog of schema app", () => {
  it("has RLS enabled and forced on every table, each one registered", async () => {
    const { rows } = await db.execute<{
      name: string;
      enabled: boolean;
      forced: boolean;
    }>(sql`
      select c.relname as name, c.relrowsecurity as enabled,
             c.relforcerowsecurity as forced
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'app' and c.relkind in ('r', 'p')
      order by 1
    `);
    const registered = new Set([
      ...TENANT_TABLES.map((table) => table.table),
      ...Object.keys(NON_TENANT_TABLES),
    ]);
    for (const row of rows) {
      expect(row, `app.${row.name} needs RLS enabled and forced`).toMatchObject(
        {
          enabled: true,
          forced: true,
        },
      );
      expect(
        registered.has(row.name),
        `app.${row.name} is missing from TENANT_TABLES (src/infra/db/testing/tenant-tables.ts)`,
      ).toBe(true);
    }
  });
});
