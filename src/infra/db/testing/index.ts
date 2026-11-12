import { createDb, type Db } from "../client";
import { LOCAL_DATABASE_URL } from "../env";
import { withTransaction, type Tx } from "../transaction";

// Shared by all integration tests (ADR-0012). F-TENANT-CORE builds the
// two-tenant isolation harness on top of it.

/**
 * Integration tests always run against the local stack, never against a
 * DATABASE_URL that happens to be set in the shell. TEST_DATABASE_URL
 * overrides it, e.g. for a stack on other ports.
 */
export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL || LOCAL_DATABASE_URL;
}

/** Connects as the owner (`postgres`, bypasses RLS), like the migration runner. */
export function createTestDb(): { db: Db; close: () => Promise<void> } {
  const { db, pool } = createDb(testDatabaseUrl(), 2);
  return { db, close: () => pool.end() };
}

class Rollback extends Error {}

/** Runs `fn` in a transaction that is always rolled back, so tests leave no rows behind. */
export async function inRollback(
  db: Db,
  fn: (tx: Tx) => Promise<void>,
): Promise<void> {
  try {
    await withTransaction(db, async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
}

export * from "./tenants";
