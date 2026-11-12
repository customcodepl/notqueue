import type { EventOutbox } from "./event-outbox";

/** What an operator use case gets inside one platform transaction. */
export interface PlatformTransactionContext {
  readonly outbox: EventOutbox;
}

/**
 * Runs operator work in one transaction across all tenants (ADR-0022). Only
 * `src/application/platform/` and `src/server/` may import this port
 * (dependency-cruiser), so cross-tenant access stays in the platform module.
 */
export interface PlatformUnitOfWork {
  run<T>(fn: (ctx: PlatformTransactionContext) => Promise<T>): Promise<T>;
}
