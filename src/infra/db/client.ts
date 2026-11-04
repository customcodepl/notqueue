import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { readDatabaseUrl, readPoolMax } from "./env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/**
 * A pool over the Supavisor transaction pooler (ADR-0013). No session state
 * survives a transaction there, so per-request settings must be
 * transaction-local and queries use no named prepared statements.
 */
export function createDb(url: string, max: number): { db: Db; pool: Pool } {
  const pool = new Pool({
    connectionString: url,
    max,
    // attachDatabasePool keeps a suspended Fluid instance alive this long
    // after the last release, so the pool can close its idle connections.
    idleTimeoutMillis: 5_000,
  });
  return { db: drizzle({ client: pool, schema }), pool };
}

let instance: Db | undefined;

/** The runtime database, created once per function instance on first use. */
export function getDb(): Db {
  if (!instance) {
    const { db, pool } = createDb(
      readDatabaseUrl("DATABASE_URL"),
      readPoolMax(),
    );
    attachDatabasePool(pool);
    instance = db;
  }
  return instance;
}
