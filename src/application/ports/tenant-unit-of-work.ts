import type { OrgId } from "@/core/tenancy/ids";

import type { EventOutbox } from "./event-outbox";

/** What a use case gets inside one tenant transaction. Repositories are added by the features that need them. */
export interface TenantTransactionContext {
  readonly orgId: OrgId;
  readonly outbox: EventOutbox;
}

/**
 * Runs a use case's work in one transaction scoped to a tenant (ADR-0022):
 * everything in `fn` commits or rolls back together, and only `orgId`'s rows
 * are visible.
 */
export interface TenantUnitOfWork {
  run<T>(
    orgId: OrgId,
    fn: (ctx: TenantTransactionContext) => Promise<T>,
  ): Promise<T>;
}
