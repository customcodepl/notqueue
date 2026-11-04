# F-FOUND-DB: Database layer

- **Stage:** 0 (Foundations)
- **Status:** plan approved (2026-11-04)
- **Depends on:** F-FOUND-REPO (done)
- **Unblocks:** F-TENANT-CORE, F-AUTH-LOGIN, F-EVENTS-OUTBOX
- **ADRs:** [ADR-0002](../../adr/0002-hosting-and-database.md), [ADR-0003](../../adr/0003-eu-regions-of-us-providers.md), [ADR-0004](../../adr/0004-business-logic-in-own-api.md), [ADR-0005](../../adr/0005-tenant-isolation-rls.md), [ADR-0006](../../adr/0006-transactional-outbox.md), [ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md); [ADR-0011](../../adr/0011-database-access-and-pooling.md) (decision 1), [ADR-0012](../../adr/0012-integration-tests-on-supabase-local-stack.md) (decision 4)

## Goal
A developer runs `pnpm db:start` and `pnpm db:migrate` and gets a local Supabase stack with the `app` schema and the outbox table. `pnpm test` runs integration tests against it, CI runs them on every PR, and every merge to `main` applies the Drizzle migrations to Supabase staging and, after approval, production. Application code can write a domain event to the outbox in the caller's transaction.

## Scope
- **Drizzle:** `drizzle-orm`, `drizzle-kit` and the `postgres` (postgres.js) driver, versions pinned. `drizzle.config.ts` at the root: dialect `postgresql`, schema filter `app`, migrations in `src/infra/db/migrations/`, migration journal table in schema `drizzle` (drizzle-kit default).
- **Schema `app`** declared with `pgSchema("app")` in `src/infra/db/schema/`. It isn't exposed through the Supabase Data API (decision 5) and gets no grants to `anon`, `authenticated` or `public`.
- **Outbox table** `app.outbox_events` (see "Data model"), with RLS enabled and no policies yet. F-TENANT-CORE adds the API role's insert policy, and F-EVENTS-OUTBOX adds the dispatcher's access.
- **Connection** (`src/infra/db/client.ts`), see decision 1:
  - runtime: `DATABASE_URL` on the Supavisor **transaction pooler** (port 6543), `prepare: false`, a small pool (`max` 5, `idle_timeout` 20 s), created lazily once per function instance and registered with `attachDatabasePool` from `@vercel/functions` so idle connections are closed before the instance is suspended;
  - migrations: `MIGRATIONS_DATABASE_URL` on the **session pooler** (IPv4, already provisioned in F-FOUND-PIPELINE).
  - Env is read and validated (Zod) only in `infra`; a missing URL fails with a clear message that names the variable but never prints its value.
- **Transaction helper (internal)** `withTransaction(db, fn)` in `src/infra/db/transaction.ts`, plus exported `Db` and `Tx` types. It's the building block for the tenant-scoped helper in F-TENANT-CORE, which sets the tenant context transaction-locally (`set_config(..., true)`, compatible with the transaction pooler). Only `infra/db` may use it directly; application code goes through the tenant-scoped helper once it exists.
- **Outbox write helper:**
  - `core`: a `DomainEvent` type (`type`, `orgId`, `aggregateType`, `aggregateId`, `payload` as JSON of IDs, enums and numbers only) and a documented no-PII rule.
  - `application`: an `EventOutbox` port with `append(event)`.
  - `infra`: `drizzleEventOutbox(tx)` implements it by inserting into `app.outbox_events` in the given transaction. The row's `created_at` is set by the database (`now()`).
- **Local Supabase stack:** the Supabase CLI as a devDependency (allowed in `pnpm-workspace.yaml` `allowBuilds`), `supabase/config.toml` from `supabase init`, with the Data API schemas limited to the defaults and unused services disabled. The `supabase/migrations/` folder stays empty: Drizzle owns migrations (decision 2). Requires Docker.
- **Scripts:**
  - `db:start` / `db:stop`: `supabase start` / `supabase stop`;
  - `db:generate`: `drizzle-kit generate` (with `--custom` for hand-written SQL);
  - `db:migrate`: a small Node script using Drizzle's migrator on `MIGRATIONS_DATABASE_URL` (falls back to the local stack URL when unset locally, never in CI);
  - `db:reset`: `supabase db reset`, then `db:migrate`;
  - `test` runs unit and integration projects; `test:unit` and `test:integration` run one each (decision 4).
- **Integration tests:** a Vitest project `integration` (`*.int.test.ts`) against the local stack. `globalSetup` applies migrations; each test runs inside a transaction that is rolled back. A shared helper (`src/infra/db/testing/`) is what F-TENANT-CORE builds its two-tenant harness on.
- **CI** (`ci.yml`): the `Checks` job runs `test:unit`. A new `Integration` job installs the Supabase CLI (`supabase/setup-cli`, pinned SHA), runs `supabase start` with unused services excluded, `db:migrate` on the fresh database, `test:integration`, and a **drift check**: `db:generate` must produce no new files (`git diff --exit-code` on the migrations folder).
- **Deploy** (`deploy.yml`): both migrate jobs replace the `psql` connectivity check with the setup action and `pnpm db:migrate`.
- **Vercel env:** `DATABASE_URL` (transaction pooler) for Preview (Supabase staging) and Production (Supabase production), marked sensitive. It isn't read by any route yet; F-FOUND-API decides whether `/health` checks the database.
- **Lint:** type-aware ESLint rules for async code (`@typescript-eslint/no-floating-promises`, `no-misused-promises`), as suggested in the F-FOUND-REPO deviations (decision 7).
- **Boundaries:** `postgres` and `@vercel/functions` are added to the framework/I/O packages forbidden in `core`; a new rule forbids `application` from importing `drizzle-orm`, `postgres` and `@supabase/*` (it depends on ports only). The fixture and its test get one case per new rule.
- **Docs:** `.env.example` (`DATABASE_URL`, `MIGRATIONS_DATABASE_URL` with local defaults), CLAUDE.md Commands (`db:*`, `test:*`, Docker prerequisite), README "Development", `src/infra/README.md` (DB folder layout), Stage 0 demo step, FEATURES.md.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Organizations, venues, DB roles for the API and operator, RLS policies, tenant-scoped transaction helper, two-tenant isolation harness | F-TENANT-CORE |
| `org_id` foreign key on the outbox | F-TENANT-CORE (the `organizations` table doesn't exist yet) |
| Profiles and references to `auth.users` | F-AUTH-LOGIN |
| Outbox dispatcher, claiming with `for update skip locked`, retries, cron sweep | F-EVENTS-OUTBOX (may add columns in its own migration) |
| `/api/v1/health` with or without a DB check | F-FOUND-API |
| Seed data for demos | F-TENANT-CORE (first tenant data) |
| Supabase branching, a database per PR | Not planned ([ADR-0009](../../adr/0009-gated-deploy-and-migration-pipeline.md), still valid on this point) |
| Down migrations | Not planned: migrations are forward-only (CLAUDE.md) |

## Affected modules
- **core:** `src/core/events/domain-event.ts` (type only).
- **application:** `src/application/ports/event-outbox.ts`.
- **infra:** `src/infra/db/` (`client.ts`, `env.ts`, `transaction.ts`, `outbox.ts`, `schema/`, `migrations/`, `testing/`), `src/infra/db/migrate.ts` (script entry).
- **Repo config:** `package.json`, lockfile, `pnpm-workspace.yaml`, `drizzle.config.ts`, `supabase/config.toml`, `vitest.config.mts` (projects), `eslint.config.mjs`, `.dependency-cruiser.cjs` and fixtures, `.github/workflows/ci.yml` and `deploy.yml`, `.env.example`, `.gitignore` (`supabase/.temp`, `supabase/.branches`).
- **Docs:** this plan, ADR-0011, ADR-0012, CLAUDE.md, README, `src/infra/README.md`, `docs/demos/stage-0.md`, FEATURES.md.

## Data model and API changes
Migration `0000_app_schema_and_outbox` (generated by drizzle-kit; the `revoke` and RLS lines are checked in the generated SQL and added with `--custom` if Drizzle doesn't emit them):

```sql
create schema if not exists app;
revoke all on schema app from public;

create table app.outbox_events (
  id             bigint generated always as identity primary key, -- dispatch order
  event_id       uuid        not null default gen_random_uuid() unique, -- consumer dedupe key
  org_id         uuid        not null,          -- FK to app.organizations added in F-TENANT-CORE
  type           text        not null,          -- e.g. 'queue.entry.called'
  aggregate_type text        not null,          -- e.g. 'queue_entry'
  aggregate_id   uuid        not null,
  payload        jsonb       not null default '{}'::jsonb, -- IDs, enums, numbers only: no PII
  created_at     timestamptz not null default now(),
  dispatched_at  timestamptz,
  attempts       integer     not null default 0
);

create index outbox_events_pending_idx
  on app.outbox_events (id) where dispatched_at is null;

alter table app.outbox_events enable row level security;
alter table app.outbox_events force row level security;
```

- `force row level security` keeps the table closed even for its owner outside migrations; the migration runner (owner, `postgres`) isn't affected by RLS for DDL. Integration tests that insert rows run as `postgres` with `bypassrls`, as on Supabase. F-TENANT-CORE adds policies for the non-owner API role.
- No endpoints.

## Conventions
- **Tenant isolation:** the outbox is a tenant table (`org_id`, RLS on, no policies, so a non-owner role sees nothing until F-TENANT-CORE). No cross-tenant reads here.
- **Layers:** `core` has the event type, `application` the port, `infra` the Drizzle code; enforced by the new boundary rules.
- **State changes / outbox:** the helper writes in the caller's transaction only; it can't open its own.
- **Time:** `created_at` and later `dispatched_at` come from the database `now()`, never from the function's clock.
- **GDPR:** payload rule documented on `DomainEvent`; connection strings never logged; Supabase stays in `eu-central-1`.
- **Migrations:** versioned SQL in the repo, forward-only, backward compatible with the code currently deployed ([ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md)); this one is written out above for review.
- **i18n / UI:** none, no user-facing strings.

## UI screens
None. This feature has no UI.

## Test plan
- **Unit:** env parsing (missing and malformed URLs give a clear error without the value); the boundary fixture test covers the new rules.
- **Integration (local stack and CI):**
  - migrations apply on an empty database, and applying them again is a no-op;
  - `app.outbox_events` exists with RLS enabled and forced, and `anon` and `authenticated` have no privileges on schema `app`;
  - `drizzleEventOutbox(tx).append()` inserts a row with DB-set `created_at` and generated `event_id`;
  - the row disappears when the caller's transaction rolls back, and is visible after commit;
  - two events in one transaction keep their order by `id`.
- **CI:** the drift check fails on a branch where the schema changes without a migration (checked once, then reverted).
- **Deploy (after merge):** "Migrate staging" and, after approval, "Migrate production" apply `0000`; the `app` schema and the outbox table exist in both Supabase projects.
- **Manual:** `pnpm db:start && pnpm db:migrate && pnpm test` on a clean clone with Docker running.

## Implementation steps
1. `build(db): add local supabase stack`: Supabase CLI, `supabase/config.toml`, `db:start` / `db:stop`, `.gitignore`.
2. `feat(db): add drizzle schema app with outbox table`: Drizzle, postgres.js, config, env, client, schema, migration `0000`, `db:generate`, `db:migrate`, `db:reset`.
3. `feat(db): add transaction and outbox write helpers`: `DomainEvent`, `EventOutbox` port, `withTransaction`, `drizzleEventOutbox`.
4. `test(db): add integration test project`: Vitest projects, `globalSetup`, rollback helper, the integration tests above; `test`, `test:unit`, `test:integration`.
5. `build(lint): enable type-aware async rules`: ESLint rules and fixes.
6. `build(deps): tighten layer rules for db packages`: dependency-cruiser rules, fixtures, test.
7. `ci(db): run integration tests and migrations in pipeline`: `Integration` job with drift check; `db:migrate` in `deploy.yml`; `DATABASE_URL` set in Vercel (settings, recorded in the PR).
8. `docs(db): document database setup`: CLAUDE.md, README, `src/infra/README.md`, `.env.example`, Stage 0 demo, ADR-0011/0012 links, FEATURES.md.

## Done when
- A clean clone with Docker runs `pnpm db:start && pnpm db:migrate && pnpm check` green.
- CI on this PR is green, including the `Integration` job and the drift check.
- After merge, both migrate jobs apply `0000` and the deploy completes.
- CLAUDE.md Commands has no DB `TODO` left; the integration-test note is updated.
- Baseline: lint, typecheck, unit, integration and E2E tests pass in CI. There are no endpoints, so the isolation suite doesn't apply yet (its harness comes with F-TENANT-CORE).
- FEATURES.md updated (status, Progress, Next up); Stage 0 demo has the migration step.

## Risks and open questions
- **Supabase stack in CI is slow** (image pulls, about 1–2 minutes). Mitigation: exclude unused services and run it as a parallel job; if it gets too slow, cache the Docker images.
- **Transaction pooler limits:** no prepared statements, no session state, no `listen/notify`. All of it is covered by `prepare: false` and transaction-local settings; the dispatcher in F-EVENTS-OUTBOX must not rely on `listen`.
- **Connection count on Vercel Fluid compute:** many instances times `max` 5 could exhaust the pooler's client limit under load. Mitigation: `max` is an env-configurable value, checked in the Stage 7 load test.
- **Supabase CLI install script:** pnpm 12 blocks install scripts by default; `supabase` needs it to download its binary, so it's allowed explicitly in `pnpm-workspace.yaml`.
- **`force row level security` and the owner role:** if Supabase's `postgres` role loses `bypassrls` on some plan or version, tests that insert as owner break. Mitigation: the tests would then switch to a dedicated test role; checked in step 4.
- **Docker becomes a local prerequisite for `pnpm test` and `pnpm check`.** Accepted with decision 4; `test:unit` stays available without it.
- No ROADMAP open question blocks this feature.

## Decisions (approved 2026-11-04)
All recommendations were accepted as proposed. Decision 1 is recorded in [ADR-0011](../../adr/0011-database-access-and-pooling.md) and decision 4 in [ADR-0012](../../adr/0012-integration-tests-on-supabase-local-stack.md).

1. **DB access and pooling (ADR):** recommended: Drizzle with postgres.js over the Supavisor transaction pooler at runtime (`prepare: false`, small lazy pool, `attachDatabasePool`) and the session pooler for migrations. That's the documented setup for serverless on Supabase, and transaction-local tenant context fits it ([ADR-0005](../../adr/0005-tenant-isolation-rls.md)). Alternatives: `node-postgres` (`pg`) (heavier, same pooling constraints); Supabase's HTTP Data API (rejected by [ADR-0004](../../adr/0004-business-logic-in-own-api.md)); the direct connection (IPv6 only, one connection per instance).
2. **Migration ownership:** recommended: drizzle-kit generates SQL into `src/infra/db/migrations/`, applied by our own `db:migrate` script; the Supabase CLI only runs the local stack. This follows [ADR-0002](../../adr/0002-hosting-and-database.md) and [ADR-0003](../../adr/0003-eu-regions-of-us-providers.md) (portability). Alternative: Supabase CLI migrations (`supabase/migrations/`) with Drizzle for queries only (two sources of schema truth).
3. **Outbox table shape:** recommended as in "Data model": `bigint` identity for dispatch order plus a `uuid` `event_id` for consumer dedupe, `org_id not null` without an FK until F-TENANT-CORE, and dispatcher columns (`dispatched_at`, `attempts`) now so F-EVENTS-OUTBOX starts with a claimable table. Alternative: a `uuid` primary key ordered by `created_at` (ties within one transaction, since `now()` is the transaction start time).
4. **Integration test strategy (ADR):** recommended: the full Supabase local stack (same Postgres version, roles, `auth` schema and extensions as production) both locally and in CI; tests run in rolled-back transactions; `pnpm test` (and so `pnpm check`) includes integration tests and needs Docker, with `test:unit` as the quick path. This affects every feature from F-TENANT-CORE on, and F-AUTH-LOGIN needs the `auth` schema. Alternatives: a plain Postgres service container (faster, but no Supabase roles or `auth` schema); Testcontainers (more code, same images).
5. **Supabase Data API on hosted projects:** recommended: turn it off in staging and production (settings, not code), since clients never use it ([ADR-0004](../../adr/0004-business-logic-in-own-api.md)), and keep the `app` schema without grants as a second guard. Auth, Realtime and Storage keep working without it. Alternative: keep it on with only the default `public` schema exposed.
6. **Where migrations run:** recommended: unchanged from [ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md): only from the deploy workflow (staging, then production after approval) and locally; never from Vercel builds or previews.
7. **Type-aware lint rules:** recommended: enable `no-floating-promises` and `no-misused-promises` now, with the first async DB code. Alternative: leave them for a later `chore`.
8. **Who sets `DATABASE_URL` in Vercel:** recommended: I set it with the Vercel CLI (each command approved by you), using the transaction pooler URLs you give me for staging and production. Alternative: you set it in the Vercel UI.

## Deviations
_To be filled in after implementation._
