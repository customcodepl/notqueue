# ADR-0022: Database roles and tenant-scoped transactions

- **Status:** accepted
- **Date:** 2026-11-12
- **Related:** [ADR-0005](0005-tenant-isolation-rls.md), [ADR-0013](0013-database-access-with-node-postgres.md), [ADR-0015](0015-composition-root.md), F-TENANT-CORE, F-AUTH-RBAC, F-AUDIT-LOG, F-PLATFORM-CONSOLE

## Context
[ADR-0005](0005-tenant-isolation-rls.md) requires the API to connect as a non-owner role with a transaction-local tenant context, and operator access through a separate role. Until F-TENANT-CORE, the runtime connected as the Supabase owner `postgres`, which bypasses RLS. Connections go through the Supavisor transaction pooler, so nothing may survive a transaction ([ADR-0013](0013-database-access-with-node-postgres.md)). Use cases in `application` must not see Drizzle or SQL, and cross-tenant queries are allowed only in the `platform` module.

## Decision
The runtime connects as a login role `notqueue_api` with no privileges of its own (`noinherit`). Each transaction switches with `set local role` to `app_tenant` (RLS by `app.org_id`, set with `set_config(..., true)`) or `app_platform` (all tenants). Use cases reach these transactions only through the `TenantUnitOfWork` and `PlatformUnitOfWork` ports, which hand them adapters bound to the transaction; only `src/application/platform/` and `src/server/` may import the platform port.

## Alternatives considered
- **Connect as `postgres` and only `set local role` in the helpers:** no ops change, but any query that skips the helpers runs with `bypassrls`.
- **One login role per purpose (tenant, platform):** two pools and two secrets per environment for no extra isolation; role switching is already transaction-local.
- **Pass a raw transaction to use cases:** simpler, but leaks infra into `application`.

## Consequences
- **Positive:** a query outside the helpers fails with `permission denied` instead of reading every tenant; the context can't leak across pooled connections; use cases stay testable with fakes.
- **Negative / accepted trade-offs:**
  - one more password per hosted project, set by the product owner, and `DATABASE_URL` uses the `notqueue_api` user;
  - grants are least-privilege, so each feature grants what its own use cases need in its migration;
  - `grant ... with set true` needs Postgres 16 or later.
- **Follow-ups:**
  - every tenant table gets policies for `app_tenant` (and `app_platform` where the operator needs it), and an entry in the isolation harness registry;
  - boundary rules restrict `withTransaction`, `withPlatformTransaction` and `PlatformUnitOfWork`;
  - F-AUTH-RBAC adds the user context to the tenant transaction; F-AUDIT-LOG audits `app_platform` use.
