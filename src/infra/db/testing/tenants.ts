import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import type { Db } from "../client";
import { organizations, outboxEvents, venues } from "../schema";
import type { Tx } from "../transaction";

// The two-tenant isolation harness (ADR-0005, ADR-0012, ADR-0022). Seeding
// runs as the owner inside the test's rolled-back transaction; `asTenant`
// and `asPlatform` switch to the same role and context as the runtime
// helpers, in a savepoint, so the test can go on afterwards.

/** Inserts an organization as the owner and returns its ID. */
export async function insertOrganization(
  executor: Db | Tx,
  name = "Test organization",
): Promise<string> {
  const [row] = await executor
    .insert(organizations)
    .values({ name })
    .returning({ id: organizations.id });
  return row!.id;
}

export interface SeededTenant {
  readonly orgId: string;
  readonly venueId: string;
}

/** Two organizations, each with one venue and one outbox event. */
export async function seedTwoTenants(
  tx: Tx,
): Promise<{ a: SeededTenant; b: SeededTenant }> {
  const seed = async (label: string): Promise<SeededTenant> => {
    const orgId = await insertOrganization(tx, `Tenant ${label}`);
    const [venue] = await tx
      .insert(venues)
      .values({
        orgId,
        slug: `tenant-${label}-${randomUUID().slice(0, 8)}`,
        name: { pl: `Lokal ${label}`, en: `Venue ${label}` },
        timezone: "Europe/Warsaw",
      })
      .returning({ id: venues.id });
    await tx.insert(outboxEvents).values({
      orgId,
      type: "test.event.recorded",
      aggregateType: "venue",
      aggregateId: venue!.id,
    });
    return { orgId, venueId: venue!.id };
  };
  return { a: await seed("a"), b: await seed("b") };
}

class Rollback extends Error {}

/** Runs `fn` in a savepoint that is always rolled back, returning its result. */
async function inSavepoint<T>(tx: Tx, fn: (sp: Tx) => Promise<T>): Promise<T> {
  let result: T;
  try {
    await tx.transaction(async (sp) => {
      result = await fn(sp);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  return result!;
}

/** Runs `fn` as `app_tenant`; `orgId` null means no tenant context. */
export function asTenant<T>(
  tx: Tx,
  orgId: string | null,
  fn: (sp: Tx) => Promise<T>,
): Promise<T> {
  return inSavepoint(tx, async (sp) => {
    await sp.execute(sql`set local role app_tenant`);
    await sp.execute(
      sql`select set_config('app.org_id', ${orgId ?? ""}, true)`,
    );
    return fn(sp);
  });
}

/** Runs `fn` as `app_platform`, without a tenant context. */
export function asPlatform<T>(tx: Tx, fn: (sp: Tx) => Promise<T>): Promise<T> {
  return inSavepoint(tx, async (sp) => {
    await sp.execute(sql`set local role app_platform`);
    return fn(sp);
  });
}

/** The Postgres error code of a failed query (drizzle wraps pg's error). */
export function pgErrorCode(error: unknown): string | undefined {
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  const code = candidate?.cause?.code ?? candidate?.code;
  return typeof code === "string" ? code : undefined;
}

export const INSUFFICIENT_PRIVILEGE = "42501";
