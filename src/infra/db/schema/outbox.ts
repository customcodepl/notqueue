import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { app } from "./app";

/**
 * Transactional outbox (ADR-0006). Rows are written in the same transaction
 * as the state change; the dispatcher (F-EVENTS-OUTBOX) delivers them in `id`
 * order. Payloads hold IDs, enums and numbers only: no PII.
 * RLS is enabled and forced with no policies yet; F-TENANT-CORE adds them.
 */
export const outboxEvents = app
  .table(
    "outbox_events",
    {
      id: bigint("id", { mode: "number" })
        .primaryKey()
        .generatedAlwaysAsIdentity(),
      eventId: uuid("event_id").notNull().unique().defaultRandom(),
      // The FK to app.organizations comes with F-TENANT-CORE.
      orgId: uuid("org_id").notNull(),
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
    ],
  )
  .enableRLS();
