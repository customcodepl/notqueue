import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import { readDatabaseUrl, readPoolMax } from "./env";
import * as schema from "./schema";
import { SUPABASE_ROOT_CA } from "./supabase-ca";

export type Db = NodePgDatabase<typeof schema>;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
// pg lets these URL parameters override the `ssl` option, which could
// silently drop the CA pinning below.
const SSL_URL_PARAMS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "ssl"];

/**
 * Pool settings for a database URL. The local stack is plain TCP; any other
 * host requires TLS verified against the pinned Supabase root CA.
 */
export function poolConfig(url: string, max: number): PoolConfig {
  const parsed = new URL(url);
  const base: PoolConfig = {
    max,
    // attachDatabasePool keeps a suspended Fluid instance alive this long
    // after the last release, so the pool can close its idle connections.
    idleTimeoutMillis: 5_000,
  };
  if (LOCAL_HOSTS.has(parsed.hostname)) {
    return { ...base, connectionString: url };
  }
  for (const param of SSL_URL_PARAMS) parsed.searchParams.delete(param);
  return {
    ...base,
    connectionString: parsed.toString(),
    ssl: { ca: SUPABASE_ROOT_CA, rejectUnauthorized: true },
  };
}

/**
 * A pool over the Supavisor transaction pooler (ADR-0013). No session state
 * survives a transaction there, so per-request settings must be
 * transaction-local and queries use no named prepared statements.
 */
export function createDb(url: string, max: number): { db: Db; pool: Pool } {
  const pool = new Pool(poolConfig(url, max));
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
