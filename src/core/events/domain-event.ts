/** A JSON value that may appear in an event payload. */
export type EventPayloadValue =
  | string
  | number
  | boolean
  | null
  | readonly EventPayloadValue[]
  | { readonly [key: string]: EventPayloadValue };

/**
 * A domain event, written to the outbox in the same transaction as the state
 * change it describes (ADR-0006).
 *
 * No PII: the payload carries only IDs, enums and numbers. Consumers that need
 * names or contact data refetch them through the API. Outbox rows reach
 * realtime channels, logs and future webhooks.
 */
export interface DomainEvent {
  /** Dotted name in the past tense, e.g. `queue.entry.called`. */
  readonly type: string;
  readonly orgId: string;
  /** Snake-case aggregate name, e.g. `queue_entry`. */
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: { readonly [key: string]: EventPayloadValue };
}
