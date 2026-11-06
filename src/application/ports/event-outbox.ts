import type { DomainEvent } from "@/core/events/domain-event";

/**
 * Appends domain events to the outbox inside the use case's transaction
 * (ADR-0006). An implementation is always bound to one open transaction: the
 * events commit or roll back together with the state change.
 */
export interface EventOutbox {
  append(event: DomainEvent): Promise<void>;
}
