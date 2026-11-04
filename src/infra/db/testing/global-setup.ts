import { runMigrations } from "../migrate";
import { testDatabaseUrl } from "./index";

/** Brings the local database up to date once before the integration tests. */
export default async function setup(): Promise<void> {
  try {
    await runMigrations(testDatabaseUrl());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Integration tests need the local Supabase stack (pnpm db:start): ${message}`,
    );
  }
}
