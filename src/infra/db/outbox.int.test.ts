import { randomUUID } from "node:crypto";

import { asc, eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import type { DomainEvent } from "@/core/events/domain-event";

import { drizzleEventOutbox } from "./outbox";
import { organizations, outboxEvents } from "./schema";
import { createTestDb, inRollback, insertOrganization } from "./testing";
import { withTransaction } from "./transaction";

const { db, close } = createTestDb();
afterAll(close);

function event(orgId: string, payload: DomainEvent["payload"]): DomainEvent {
  return {
    type: "test.event.recorded",
    orgId,
    aggregateType: "test_aggregate",
    aggregateId: randomUUID(),
    payload,
  };
}

describe("drizzleEventOutbox", () => {
  it("inserts a row with database-set id, event_id and created_at", async () => {
    await inRollback(db, async (tx) => {
      const orgId = await insertOrganization(tx);
      const appended = event(orgId, { position: 3 });
      await drizzleEventOutbox(tx).append(appended);

      const [row] = await tx
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.orgId, orgId));
      expect(row).toMatchObject({
        type: appended.type,
        aggregateType: appended.aggregateType,
        aggregateId: appended.aggregateId,
        payload: { position: 3 },
        dispatchedAt: null,
        attempts: 0,
      });
      expect(row!.eventId).toMatch(/^[0-9a-f-]{36}$/);

      // now() is the transaction start, so the row carries the database
      // clock. Compared in SQL: a JS Date drops the microseconds.
      const { rows } = await tx.execute<{ fromDb: boolean }>(
        sql`select created_at = now() as "fromDb" from app.outbox_events where org_id = ${orgId}`,
      );
      expect(rows).toEqual([{ fromDb: true }]);
    });
  });

  it("keeps the order of events within one transaction", async () => {
    await inRollback(db, async (tx) => {
      const orgId = await insertOrganization(tx);
      const outbox = drizzleEventOutbox(tx);
      for (const step of [1, 2, 3]) await outbox.append(event(orgId, { step }));

      const rows = await tx
        .select({ payload: outboxEvents.payload })
        .from(outboxEvents)
        .where(eq(outboxEvents.orgId, orgId))
        .orderBy(asc(outboxEvents.id));
      expect(rows.map((row) => row.payload)).toEqual([
        { step: 1 },
        { step: 2 },
        { step: 3 },
      ]);
    });
  });

  it("commits and rolls back with the caller's transaction", async () => {
    const committedOrg = await insertOrganization(db);
    const rolledBackOrg = await insertOrganization(db);
    try {
      await withTransaction(db, (tx) =>
        drizzleEventOutbox(tx).append(event(committedOrg, {})),
      );
      await expect(
        withTransaction(db, async (tx) => {
          await drizzleEventOutbox(tx).append(event(rolledBackOrg, {}));
          throw new Error("state change failed");
        }),
      ).rejects.toThrow("state change failed");

      const count = async (orgId: string) =>
        (
          await db
            .select()
            .from(outboxEvents)
            .where(eq(outboxEvents.orgId, orgId))
        ).length;
      expect(await count(committedOrg)).toBe(1);
      expect(await count(rolledBackOrg)).toBe(0);
    } finally {
      await db.delete(outboxEvents).where(eq(outboxEvents.orgId, committedOrg));
      for (const id of [committedOrg, rolledBackOrg]) {
        await db.delete(organizations).where(eq(organizations.id, id));
      }
    }
  });
});
