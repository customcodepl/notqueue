import type { Db } from "./client";

/** An open transaction; everything run on it commits or rolls back together. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Runs `fn` in one transaction: commits when it resolves, rolls back when it
 * throws. Only `withTenantTransaction`, `withPlatformTransaction` and tests
 * may call it (dependency-cruiser); they set the role and tenant context
 * transaction-locally (ADR-0005, ADR-0013, ADR-0022).
 */
export function withTransaction<T>(
  db: Db,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}
