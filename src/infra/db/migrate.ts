import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb } from "./client";
import { readDatabaseUrl } from "./env";

export const MIGRATIONS_FOLDER = "src/infra/db/migrations";

/** Applies pending migrations; already applied ones are skipped. */
export async function runMigrations(url: string): Promise<void> {
  const { db, pool } = createDb(url, 1);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}

// `pnpm db:migrate`: the deploy workflow on the session pooler, or the local
// stack when MIGRATIONS_DATABASE_URL is unset outside CI.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations(
    readDatabaseUrl("MIGRATIONS_DATABASE_URL", process.env, {
      localFallback: true,
    }),
  )
    .then(() => console.log("Migrations applied."))
    .catch((error: unknown) => {
      // Only the message: errors from pg can include connection details.
      console.error(
        `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    });
}
