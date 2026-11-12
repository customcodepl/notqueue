import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { organizations, venues } from "./schema";
import { DEMO_ORG_ID, seedDemo } from "./seed";
import { createTestDb, inRollback } from "./testing";

const { db, close } = createTestDb();
afterAll(close);

describe("seedDemo", () => {
  it("inserts one organization and venue, and nothing more on a second run", async () => {
    await inRollback(db, async (tx) => {
      await seedDemo(tx);
      await seedDemo(tx);
      const orgs = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, DEMO_ORG_ID));
      const demoVenues = await tx
        .select()
        .from(venues)
        .where(eq(venues.orgId, DEMO_ORG_ID));
      expect(orgs).toHaveLength(1);
      expect(demoVenues.map((venue) => venue.slug)).toEqual(["demo-bistro"]);
    });
  });
});
