import { sql } from "drizzle-orm";

import { parseOrgId, type OrgId } from "@/core/tenancy/ids";

import type { Db } from "./client";
import { withTransaction, type Tx } from "./transaction";

/**
 * Runs `fn` in a transaction as `app_tenant`, with the tenant set
 * transaction-locally (ADR-0005, ADR-0022). RLS then limits every row to
 * `orgId`; nothing survives the transaction on the pooled connection.
 */
export async function withTenantTransaction<T>(
  db: Db,
  orgId: OrgId,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  // Checked again at runtime: a bad ID must fail before any query.
  const tenant = parseOrgId(orgId);
  return withTransaction(db, async (tx) => {
    await tx.execute(sql`set local role app_tenant`);
    await tx.execute(sql`select set_config('app.org_id', ${tenant}, true)`);
    return fn(tx);
  });
}
