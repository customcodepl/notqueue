import { sql } from "drizzle-orm";
import { pgRole } from "drizzle-orm/pg-core";

// Database roles (ADR-0022). They are cluster-wide, so migrations create them
// by hand only if missing; Drizzle just references them in policies.

/** Tenant access: RLS limits every row to `app.current_org_id()`. */
export const appTenant = pgRole("app_tenant").existing();

/** Operator access across tenants; only the `platform` module reaches it. */
export const appPlatform = pgRole("app_platform").existing();

/** The tenant set by `withTenantTransaction`, or null without context. */
export const currentOrgId = sql`app.current_org_id()`;
