import { sql } from "drizzle-orm";

import type { DatabaseHealth } from "@/application/ports/database-health";

import type { Db } from "./client";

/**
 * `select 1` with a timeout. Takes a getter so the database (and
 * DATABASE_URL) is touched only on the first check, not at import.
 * Used by GET /api/v1/health.
 */
export function drizzleDatabaseHealth(
  getDb: () => Db,
  timeoutMs = 2_000,
): DatabaseHealth {
  return {
    async ping() {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Database did not answer within ${timeoutMs} ms`));
        }, timeoutMs);
      });
      try {
        await Promise.race([getDb().execute(sql`select 1`), timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
