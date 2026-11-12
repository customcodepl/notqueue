import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { app } from "./app";
import { organizations } from "./organizations";
import { appPlatform, appTenant, currentOrgId } from "./roles";

/**
 * Transactional outbox (ADR-0006). Rows are written in the same transaction
 * as the state change; the dispatcher (F-EVENTS-OUTBOX) delivers them in `id`
 * order. Payloads hold IDs, enums and numbers only: no PII.
 * RLS is enabled and forced. The API roles may only insert, a tenant only for
 * itself; the dispatcher's access comes with F-EVENTS-OUTBOX.
 */
export const outboxEvents = app
  .table(
    "outbox_events",
    {
      id: bigint("id", { mode: "number" })
        .primaryKey()
        .generatedAlwaysAsIdentity(),
      eventId: uuid("event_id").notNull().unique().defaultRandom(),
      orgId: uuid("org_id")
        .notNull()
        .references(() => organizations.id),
      type: text("type").notNull(),
      aggregateType: text("aggregate_type").notNull(),
      aggregateId: uuid("aggregate_id").notNull(),
      payload: jsonb("payload")
        .notNull()
        .default(sql`'{}'::jsonb`),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
      attempts: integer("attempts").notNull().default(0),
    },
    (table) => [
      index("outbox_events_pending_idx")
        .on(table.id)
        .where(sql`${table.dispatchedAt} is null`),
      pgPolicy("outbox_tenant_insert", {
        for: "insert",
        to: appTenant,
        withCheck: sql`${table.orgId} = ${currentOrgId}`,
      }),
      pgPolicy("outbox_platform_insert", {
        for: "insert",
        to: appPlatform,
        withCheck: sql`true`,
      }),
    ],
  )
  .enableRLS();
