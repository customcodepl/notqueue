# ADR-0012: Integration tests on the Supabase local stack

- **Status:** accepted
- **Date:** 2026-11-04
- **Related:** [ADR-0002](0002-hosting-and-database.md), [ADR-0005](0005-tenant-isolation-rls.md), F-FOUND-DB, F-TENANT-CORE, F-AUTH-LOGIN

## Context
Tenant isolation relies on RLS, which only real Postgres can prove ([ADR-0005](0005-tenant-isolation-rls.md)). Every feature from F-TENANT-CORE on adds integration tests. These features depend on Supabase-specific parts: the roles (`anon`, `authenticated`, `service_role`), the `auth` schema (F-AUTH-LOGIN), and the Postgres version and extensions of the hosted projects. Tests must give the same result locally and in CI.

## Decision
Integration tests run against the Supabase local stack (Supabase CLI, Docker), both locally and in CI. Migrations are applied once in a global setup, and each test runs in a transaction that is rolled back. `pnpm test` and `pnpm check` include the integration tests. `test:unit` is the quick path without Docker.

## Alternatives considered
- **Plain Postgres service container:** faster to start, but without the Supabase roles, `auth` schema or matching extensions; tests would pass on a database unlike production.
- **Testcontainers:** more test code to start the same images, with no gain over the CLI.
- **Hosted Supabase staging for tests:** shared state, network latency, and test data mixed with demo data.

## Consequences
- **Positive:** RLS, roles and `auth` behave as in production; one command for local and CI; fast, isolated tests through rollback.
- **Negative / accepted trade-offs:** Docker is a local prerequisite for `pnpm test`; CI spends about 1–2 minutes starting the stack; tests can't cover code that commits its own transactions without extra cleanup.
- **Follow-ups:** F-TENANT-CORE builds the two-tenant isolation harness on the shared test helper; unused stack services are excluded in CI; the CLI version is pinned and bumped deliberately.
