import { sql } from "drizzle-orm";

import type { Db } from "./client";
import { withTransaction, type Tx } from "./transaction";

/**
 * Runs `fn` in a transaction as `app_platform`, which sees every tenant
 * (ADR-0022). Only the platform unit of work and tests may import this;
 * operator use cases reach it through `PlatformUnitOfWork`.
 */
export function withPlatformTransaction<T>(
  db: Db,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return withTransaction(db, async (tx) => {
    await tx.execute(sql`set local role app_platform`);
    await tx.execute(sql`select set_config('app.org_id', '', true)`);
    return fn(tx);
  });
}
