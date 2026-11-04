import type { EventOutbox } from "@/application/ports/event-outbox";

import { outboxEvents } from "./schema";
import type { Tx } from "./transaction";

/**
 * The outbox bound to the caller's transaction. It never opens a transaction
 * of its own; `id`, `event_id` and `created_at` are set by the database.
 */
export function drizzleEventOutbox(tx: Tx): EventOutbox {
  return {
    async append(event) {
      await tx.insert(outboxEvents).values({
        orgId: event.orgId,
        type: event.type,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
      });
    },
  };
}
