import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import type { Locale } from "@/core/i18n/locale";
import { parseOrgId } from "@/core/tenancy/ids";
import { DEFAULT_VENUE_SETTINGS } from "@/core/tenancy/venue";

import { venues } from "./schema";
import {
  createTestDb,
  inRollback,
  insertOrganization,
  pgErrorCode,
} from "./testing";
import type { Tx } from "./transaction";
import { toVenue, toVenueRow } from "./venue-mapper";

const { db, close } = createTestDb();
afterAll(close);

const CHECK_VIOLATION = "23514";

async function insertVenue(
  tx: Tx,
  values: Partial<typeof venues.$inferInsert> = {},
) {
  const orgId = await insertOrganization(tx);
  const [row] = await tx
    .insert(venues)
    .values({
      orgId,
      slug: `venue-${randomUUID().slice(0, 8)}`,
      name: { pl: "Bistro" },
      timezone: "Europe/Warsaw",
      ...values,
    })
    .returning();
  return row!;
}

async function rejection(tx: Tx, values: Partial<typeof venues.$inferInsert>) {
  try {
    await tx.transaction(async (sp) => {
      await insertVenue(sp, values);
    });
    return undefined;
  } catch (error) {
    return pgErrorCode(error);
  }
}

describe("app.venues", () => {
  it("fills every setting with its default", async () => {
    await inRollback(db, async (tx) => {
      const venue = toVenue(await insertVenue(tx));
      expect(venue.settings).toEqual({
        ...DEFAULT_VENUE_SETTINGS,
        timezone: "Europe/Warsaw",
      });
      expect(venue.status).toBe("active");
    });
  });

  it.each([
    ["a name without the default locale", { name: { en: "Bistro" } }],
    ["a blank name in the default locale", { name: { pl: "  " } }],
    ["a name that isn't an object", { name: "Bistro" as never }],
    ["a default locale that isn't enabled", { enabledLocales: ["en"] }],
    ["no enabled locales", { enabledLocales: [] }],
    ["a privacy notice over http", { privacyNoticeUrl: "http://example.com" }],
    ["a malformed slug", { slug: "Bistro_1" }],
  ])("rejects %s", async (_, values) => {
    await inRollback(db, async (tx) => {
      expect(await rejection(tx, values)).toBe(CHECK_VIOLATION);
    });
  });

  it("sets updated_at from the database on update", async () => {
    await inRollback(db, async (tx) => {
      const venue = await insertVenue(tx, {
        updatedAt: new Date("2000-01-01T00:00:00Z"),
      });
      await tx
        .update(venues)
        .set({ browserLocaleEnabled: false })
        .where(eq(venues.id, venue.id));
      const { rows } = await tx.execute<{ fromDb: boolean }>(
        sql`select updated_at = now() as "fromDb" from app.venues where id = ${venue.id}`,
      );
      expect(rows).toEqual([{ fromDb: true }]);
    });
  });
});

describe("venue mapper", () => {
  it("round-trips a venue", async () => {
    await inRollback(db, async (tx) => {
      const orgId = parseOrgId(await insertOrganization(tx));
      const input = {
        orgId,
        slug: "bistro-pod-lipa",
        name: { pl: "Bistro pod Lipą", en: "Linden Bistro" },
        settings: { ...DEFAULT_VENUE_SETTINGS, timezone: "Europe/Warsaw" },
      };
      const [row] = await tx
        .insert(venues)
        .values(toVenueRow(input))
        .returning();
      expect(toVenue(row!)).toMatchObject(input);
    });
  });

  it("rejects locale codes core doesn't support, on write and on read", async () => {
    const settings = {
      ...DEFAULT_VENUE_SETTINGS,
      timezone: "Europe/Warsaw",
      enabledLocales: ["pl", "de"] as Locale[],
    };
    expect(() =>
      toVenueRow({
        orgId: parseOrgId(randomUUID()),
        slug: "bistro",
        name: { pl: "Bistro" },
        settings,
      }),
    ).toThrow('Unsupported locale "de"');

    await inRollback(db, async (tx) => {
      const row = await insertVenue(tx, { enabledLocales: ["pl", "de"] });
      expect(() => toVenue(row)).toThrow('Unsupported locale "de"');
    });
  });
});
