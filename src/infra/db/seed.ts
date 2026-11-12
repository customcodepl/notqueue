import { parseOrgId } from "@/core/tenancy/ids";
import { DEFAULT_VENUE_SETTINGS } from "@/core/tenancy/venue";

import { createDb, isLocalDatabaseUrl, type Db } from "./client";
import { readDatabaseUrl } from "./env";
import { organizations, venues } from "./schema";
import type { Tx } from "./transaction";
import { toVenueRow } from "./venue-mapper";

// `pnpm db:seed`: one demo tenant for the local stack (F-TENANT-CORE,
// decision 6). Hosted projects get tenants through the operator console.

export const DEMO_ORG_ID = parseOrgId("00000000-0000-4000-8000-000000000001");
export const DEMO_VENUE_ID = "00000000-0000-4000-8000-000000000101";

/** Inserts the demo organization and venue as the owner; a second run changes nothing. */
export async function seedDemo(executor: Db | Tx): Promise<void> {
  await executor
    .insert(organizations)
    .values({ id: DEMO_ORG_ID, name: "Demo Bistro sp. z o.o." })
    .onConflictDoNothing();
  await executor
    .insert(venues)
    .values({
      id: DEMO_VENUE_ID,
      ...toVenueRow({
        orgId: DEMO_ORG_ID,
        slug: "demo-bistro",
        name: { pl: "Demo Bistro", en: "Demo Bistro" },
        settings: { ...DEFAULT_VENUE_SETTINGS, timezone: "Europe/Warsaw" },
      }),
    })
    .onConflictDoNothing();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = readDatabaseUrl("MIGRATIONS_DATABASE_URL", process.env, {
    localFallback: true,
  });
  if (!isLocalDatabaseUrl(url)) {
    console.error("db:seed runs only against the local stack.");
    process.exit(1);
  }
  const { db, pool } = createDb(url, 1);
  seedDemo(db)
    .then(() => console.log("Demo tenant seeded."))
    .catch((error: unknown) => {
      // Only the message: errors from pg can include connection details.
      console.error(
        `Seeding failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
