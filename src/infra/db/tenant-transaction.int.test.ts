import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { parseOrgId, type OrgId } from "@/core/tenancy/ids";

import { createDb } from "./client";
import { withPlatformTransaction } from "./platform-transaction";
import { organizations, outboxEvents } from "./schema";
import { withTenantTransaction } from "./tenant-transaction";
import { insertOrganization, testDatabaseUrl } from "./testing";
import { withTransaction, type Tx } from "./transaction";
import { drizzleTenantUnitOfWork } from "./unit-of-work";

// One connection, so every transaction reuses the same pooled session.
const { db, pool } = createDb(testDatabaseUrl(), 1);
afterAll(() => pool.end());

async function session(tx: Tx) {
  const { rows } = await tx.execute<{ role: string; org: string | null }>(
    sql`select current_user as role, app.current_org_id() as org`,
  );
  return rows[0]!;
}

describe("withTenantTransaction", () => {
  it("runs as app_tenant with the tenant set", async () => {
    const orgId = parseOrgId(randomUUID());
    expect(await withTenantTransaction(db, orgId, session)).toEqual({
      role: "app_tenant",
      org: orgId,
    });
  });

  it("leaves no role or tenant on the connection afterwards", async () => {
    await withTenantTransaction(db, parseOrgId(randomUUID()), session);
    expect(await withTransaction(db, session)).toEqual({
      role: "postgres",
      org: null,
    });
  });

  it("rejects an ID that isn't a UUID without connecting", async () => {
    // Nothing listens on port 1: a query would fail with a connection error.
    const unreachable = createDb("postgresql://x:y@127.0.0.1:1/none", 1);
    await expect(
      withTenantTransaction(unreachable.db, "org-1" as OrgId, session),
    ).rejects.toThrow("OrgId must be a UUID");
    await unreachable.pool.end();
  });
});

describe("withPlatformTransaction", () => {
  it("runs as app_platform without a tenant", async () => {
    expect(await withPlatformTransaction(db, session)).toEqual({
      role: "app_platform",
      org: null,
    });
  });
});

describe("drizzleTenantUnitOfWork", () => {
  it("commits the tenant's outbox events and rejects another tenant's", async () => {
    const own = parseOrgId(await insertOrganization(db));
    const other = await insertOrganization(db);
    const unitOfWork = drizzleTenantUnitOfWork(() => db);
    const event = (orgId: string) => ({
      type: "test.event.recorded",
      orgId,
      aggregateType: "test_aggregate",
      aggregateId: randomUUID(),
      payload: {},
    });
    try {
      await unitOfWork.run(own, (ctx) => ctx.outbox.append(event(ctx.orgId)));
      await expect(
        unitOfWork.run(own, (ctx) => ctx.outbox.append(event(other))),
      ).rejects.toMatchObject({ cause: { code: "42501" } });

      const rows = await db
        .select({ orgId: outboxEvents.orgId })
        .from(outboxEvents)
        .where(sql`${outboxEvents.orgId} in (${own}, ${other})`);
      expect(rows).toEqual([{ orgId: own }]);
    } finally {
      await db.delete(outboxEvents).where(eq(outboxEvents.orgId, own));
      for (const id of [own, other]) {
        await db.delete(organizations).where(eq(organizations.id, id));
      }
    }
  });
});
