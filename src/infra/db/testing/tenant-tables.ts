import type { SeededTenant } from "./tenants";

/**
 * Every tenant table in schema `app`, for the generated isolation tests.
 * A new tenant table must be added here; the catalog test fails until it
 * is (or until it is listed in NON_TENANT_TABLES with a reason).
 */
export interface TenantTable {
  readonly table: string;
  /** The column that holds the tenant: `org_id`, or `id` on the tenant root. */
  readonly tenantColumn: string;
  /** A no-op update target, to prove another tenant's rows can't be changed. */
  readonly touchColumn: string;
  /** Column values for a new row that belongs to `tenant`. */
  readonly newRow: (tenant: SeededTenant) => Record<string, unknown>;
}

export const TENANT_TABLES: readonly TenantTable[] = [
  {
    table: "organizations",
    tenantColumn: "id",
    touchColumn: "name",
    newRow: () => ({ name: "Intruder" }),
  },
  {
    table: "venues",
    tenantColumn: "org_id",
    touchColumn: "slug",
    newRow: (tenant) => ({
      org_id: tenant.orgId,
      slug: "intruder",
      name: JSON.stringify({ pl: "Intruz" }),
      timezone: "Europe/Warsaw",
    }),
  },
  {
    table: "outbox_events",
    tenantColumn: "org_id",
    touchColumn: "attempts",
    newRow: (tenant) => ({
      org_id: tenant.orgId,
      type: "test.event.recorded",
      aggregate_type: "venue",
      aggregate_id: tenant.venueId,
    }),
  },
];

/** Tables in `app` that hold no tenant data, each with the reason. None yet. */
export const NON_TENANT_TABLES: Readonly<Record<string, string>> = {};
