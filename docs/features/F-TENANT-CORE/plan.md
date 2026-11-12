# F-TENANT-CORE: Tenant model & RLS

- **Stage:** 1 (Tenancy, auth & operator console)
- **Status:** done (2026-11-12); plan approved 2026-11-12
- **Depends on:** F-FOUND-DB (done), F-FOUND-I18N (done)
- **Unblocks:** F-AUTH-RBAC, F-AUDIT-LOG, F-QUEUE-MODEL, F-PUBLIC-VENUE (and, through the venue columns, F-VENUE-LOCALES and F-VENUE-SETTINGS)
- **ADRs:** [ADR-0005](../../adr/0005-tenant-isolation-rls.md), [ADR-0006](../../adr/0006-transactional-outbox.md), [ADR-0012](../../adr/0012-integration-tests-on-supabase-local-stack.md), [ADR-0013](../../adr/0013-database-access-with-node-postgres.md), [ADR-0015](../../adr/0015-composition-root.md), [ADR-0019](../../adr/0019-locales-and-localized-text-in-core.md); [ADR-0022](../../adr/0022-database-roles-and-tenant-scoped-transactions.md) (decisions 1 and 3)

## Goal
Organizations and venues exist in schema `app` with every venue setting column and its default. The API reaches tenant data only through a tenant-scoped transaction that runs as a non-owner role with the tenant set transaction-locally, and RLS returns nothing for another tenant or for a missing context. A two-tenant integration harness proves this for every tenant table, and fails when a new table in `app` has no RLS.

## Scope
- **Tables** `app.organizations` and `app.venues` (see "Data model"), with RLS enabled and forced. `app.venues` has every column that later features read before they can edit it ([FEATURES.md](../../FEATURES.md#review-findings), C-6): IANA `timezone`, `business_day_start`, locales, contact-field policy, privacy notice URL, status.
- **Outbox:** the FK `outbox_events.org_id → organizations.id` and the insert policies postponed by F-FOUND-DB.
- **DB roles** (decision 1): a login role `notqueue_api` with no privileges of its own, which switches per transaction to `app_tenant` (RLS by tenant) or `app_platform` (operator, all tenants). Least-privilege grants: each later feature grants what its own use cases need.
- **Tenant context:** `set_config('app.org_id', <uuid>, true)` and `set local role`, both transaction-local (ADR-0013); SQL function `app.current_org_id()` reads it for the policies.
- **Transaction helpers** in `src/infra/db/`:
  - `withTenantTransaction(db, orgId, fn)`: opens a transaction, sets role `app_tenant` and the context, then runs `fn(tx)`.
  - `withPlatformTransaction(db, fn)`: same with role `app_platform` and no tenant context.
  - Boundary rules: `withTransaction` only in these two helpers and `testing/`; `withPlatformTransaction` only in its unit-of-work adapter and `testing/`.
- **Application ports** (decision 3): `TenantUnitOfWork` and `PlatformUnitOfWork` in `src/application/ports/`, so use cases run in a transaction without importing Drizzle. `run(orgId, fn)` / `run(fn)` give `fn` the transaction's adapters (the outbox now; repositories as features add them). Implemented in `infra`, wired in `src/server/` (ADR-0015).
  - The `platform` module is `src/application/platform/` (its first use cases come with F-PLATFORM-CONSOLE). A boundary rule lets only that folder and `src/server/` import `PlatformUnitOfWork`, which is how "cross-tenant queries only in the `platform` module" is enforced.
  - No use case uses either port yet; F-AUTH-RBAC and F-PLATFORM-CONSOLE are the first.
- **Domain types** in `src/core/tenancy/`: branded `OrgId` and `VenueId`, `VenueSlug` (format rule), `ContactFieldPolicy` (`required` | `optional` | `hidden`) and the platform defaults, `VenueSettings`, and a `TimeOfDay` (`HH:mm`) value for `business_day_start`. Pure, unit-tested.
- **Local role password:** `pnpm db:migrate` sets the password of `notqueue_api` to a fixed local value, only when the URL points at the local stack. `.env.example` uses `notqueue_api` in the local `DATABASE_URL`, so `pnpm dev` runs with the same role as production.
- **Isolation harness** in `src/infra/db/testing/`:
  - `seedTwoTenants(tx)`: two organizations with one venue each, inserted as owner in the test's rolled-back transaction;
  - `asTenant(tx, orgId, fn)` and `asPlatform(tx, fn)`: run `fn` with the same role and context as the helpers, then reset them;
  - a registry of tenant tables, and one generated test per table: tenant A sees only A's rows, can't insert or update a row with B's `org_id`, sees nothing without context; `anon` and `authenticated` have no access;
  - a catalog test: every table in schema `app` has RLS enabled and forced and is either in the registry or on an explicit list of non-tenant tables (none yet), so a new table without policies fails the suite.

  F-AUTH-RBAC builds the per-endpoint suite on these helpers.
- **Local seed** (decision 6): `pnpm db:seed` inserts one demo organization and venue (idempotent), and refuses any non-local URL.
- **Deploy:** after merge, the product owner sets the `notqueue_api` password in the staging and production projects and switches `DATABASE_URL` in Vercel to that user (click-by-click steps in the PR; non-secret check: `/api/v1/health` answers 200 and `select usename from pg_stat_activity` in the SQL editor shows `notqueue_api`).
- **Docs:** ADR-0022, `src/infra/README.md`, `src/core/README.md`, `.env.example`, `src/application/README.md` (ports), README (architecture: roles; secrets table: `DATABASE_URL` user), CLAUDE.md (Commands: `db:seed`; the "Tenant isolation" rule names both helpers and their ports), new `docs/demos/stage-1.md`, FEATURES.md.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Profiles, `auth.users` references, user context in the transaction | F-AUTH-LOGIN, F-AUTH-RBAC |
| Memberships, venue scope in policies, per-endpoint isolation suite | F-AUTH-RBAC |
| Audit of operator access (`app_platform` use) | F-AUDIT-LOG, F-PLATFORM-CONSOLE |
| Creating, suspending organizations and venues; retention days column | F-PLATFORM-CONSOLE (retention blocked by ROADMAP Q7) |
| Slug → tenant resolution (security definer), reserved slugs | F-PUBLIC-VENUE |
| Branding columns (logo, accent color) | F-VENUE-BRANDING |
| Opening hours | F-VENUE-HOURS |
| Business-day calculation (`date-fns` / `@date-fns/tz`) | F-QUEUE-MODEL (ticket counters are its first use) |
| Outbox dispatcher access | F-EVENTS-OUTBOX |
| Endpoints | None here; the first tenant endpoints come with F-AUTH-RBAC |

## Affected modules
- **core:** `src/core/tenancy/` (types, slug rule, contact-field defaults, `TimeOfDay`).
- **application:** `src/application/ports/tenant-unit-of-work.ts`, `src/application/ports/platform-unit-of-work.ts`.
- **infra:** `src/infra/db/schema/` (`organizations.ts`, `venues.ts`, roles and policies), migration `0001`, `tenant-transaction.ts`, `platform-transaction.ts`, `unit-of-work.ts` (both adapters), `migrate.ts` (local password), `seed.ts`, `testing/` (harness).
- **server:** `src/server/` wires both units of work (unused until F-AUTH-RBAC and F-PLATFORM-CONSOLE, kept so the wiring is reviewed once).
- **Repo config:** `package.json` (`db:seed`), `.dependency-cruiser.cjs` and fixtures, `.env.example`.
- **Docs:** listed in "Scope".

## Data model and API changes
Migration `0001_tenants` (generated by drizzle-kit from the schema, which declares roles with `pgRole`, policies with `pgPolicy` and `.enableRLS()`; anything Drizzle doesn't emit is appended by hand, as in `0000`):

```sql
-- Roles (cluster-wide, so created only if missing)
do $$ begin
  if not exists (select from pg_roles where rolname = 'app_tenant') then
    create role app_tenant nologin nobypassrls; end if;
  if not exists (select from pg_roles where rolname = 'app_platform') then
    create role app_platform nologin nobypassrls; end if;
  if not exists (select from pg_roles where rolname = 'notqueue_api') then
    create role notqueue_api login noinherit nobypassrls; end if; -- password set outside migrations
end $$;
grant app_tenant, app_platform to notqueue_api with inherit false, set true;
-- The owner (Supabase `postgres`, not a superuser) needs SET too: the harness
-- switches roles inside the owner's test transaction, and so does the demo in
-- the SQL editor. It gains nothing, since it already bypasses RLS.
grant app_tenant, app_platform to postgres with inherit false, set true;
grant usage on schema app to app_tenant, app_platform;

create type app.record_status as enum ('active', 'suspended');
create type app.contact_field_policy as enum ('required', 'optional', 'hidden');

create function app.current_org_id() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.org_id', true), '')::uuid $$;

create function app.set_updated_at() returns trigger
  language plpgsql
  as $$ begin new.updated_at := now(); return new; end $$;

create table app.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (btrim(name) <> ''),  -- legal or trading name, not localized
  status     app.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.venues (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 uuid not null references app.organizations (id),
  slug                   text not null unique
                           check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$'),
  name                   jsonb not null,               -- LocalizedText
  status                 app.record_status not null default 'active',
  timezone               text not null,                -- IANA, validated in the app; no default (C-6)
  business_day_start     time(0) not null default '04:00',
  default_locale         text not null default 'pl',
  enabled_locales        text[] not null default '{pl,en}',
  browser_locale_enabled boolean not null default true,
  contact_name_policy    app.contact_field_policy not null default 'required',
  contact_phone_policy   app.contact_field_policy not null default 'optional', -- ROADMAP Q4
  contact_email_policy   app.contact_field_policy not null default 'hidden',
  privacy_notice_url     text check (privacy_notice_url ~ '^https://'),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (jsonb_typeof(name) = 'object'),
  check (btrim(coalesce(name ->> default_locale, '')) <> ''), -- fallback always resolves
  check (cardinality(enabled_locales) > 0 and default_locale = any (enabled_locales))
);
create index venues_org_id_idx on app.venues (org_id);

create trigger organizations_updated_at before update on app.organizations
  for each row execute function app.set_updated_at();
create trigger venues_updated_at before update on app.venues
  for each row execute function app.set_updated_at();

alter table app.outbox_events
  add constraint outbox_events_org_id_fkey foreign key (org_id) references app.organizations (id);

-- RLS (enable + force on both new tables, as on the outbox)
alter table app.organizations enable row level security;
alter table app.organizations force row level security;
alter table app.venues enable row level security;
alter table app.venues force row level security;

grant select on app.organizations, app.venues to app_tenant;
grant insert on app.outbox_events to app_tenant;
grant select, insert, update on app.organizations, app.venues to app_platform;
grant insert on app.outbox_events to app_platform;

create policy organizations_tenant on app.organizations for select to app_tenant
  using (id = app.current_org_id());
create policy venues_tenant on app.venues for select to app_tenant
  using (org_id = app.current_org_id());
create policy outbox_tenant_insert on app.outbox_events for insert to app_tenant
  with check (org_id = app.current_org_id());
create policy organizations_platform on app.organizations for all to app_platform
  using (true) with check (true);
create policy venues_platform on app.venues for all to app_platform
  using (true) with check (true);
create policy outbox_platform_insert on app.outbox_events for insert to app_platform
  with check (true);
```

- Locale codes are not checked in SQL: the list lives in `core` (ADR-0019), and the infra mapper rejects unknown codes on write and read. A DB check would mean a migration for every new locale (decision 5).
- `timezone` is validated with `IanaTimeZone` where it enters the system; Postgres has no immutable check for it.
- No `delete` grants: organizations and venues are suspended, never deleted (GDPR erasure concerns customer data, F-GDPR-DATA).
- No endpoints, so `docs/api/openapi.json` doesn't change.

## Conventions
- **Tenant isolation:** `venues` and `outbox_events` carry `org_id`; `organizations` is the tenant root and is scoped by `id`. All three have RLS enabled and forced, and the harness covers them. Cross-tenant access exists only through `app_platform`, behind `withPlatformTransaction` and the `PlatformUnitOfWork` port, which only `src/application/platform/` and `src/server/` may import.
- **Layers:** types in `core`, the port in `application`, Drizzle and SQL in `infra`, wiring in `src/server/` (ADR-0015).
- **State changes / outbox:** no use cases create or change tenants here; the seed is test data, not a domain change. `organization.created` and friends come with F-PLATFORM-CONSOLE.
- **Time:** `created_at` / `updated_at` set by the database (`now()`, trigger); `timezone` is an IANA name; `business_day_start` is a local wall-clock `time`, never converted.
- **i18n:** `venues.name` is `LocalizedText`, with the default locale required; no UI strings.
- **GDPR:** organizations and venues hold no personal data. The contact-field defaults collect the least by default (phone optional, email hidden). The role password and `DATABASE_URL` are never printed.
- **Migrations:** `0001` is written out above for review, forward-only and compatible with the code currently deployed, which uses neither the new tables nor the new role.

## UI screens
None. This feature has no UI.

## Test plan
- **Unit:** `VenueSlug` accepts and rejects the right strings; `TimeOfDay` parses `HH:mm` and rejects `24:00` and seconds; contact-field defaults are name required, phone optional, email hidden; the venue mapper rejects unknown locale codes; the boundary fixture test has a case per new rule.
- **Integration (local stack and CI):**
  - `0001` applies on top of `0000`, and running `db:migrate` again is a no-op (roles already exist);
  - the harness tests for `organizations`, `venues` and `outbox_events` (see "Scope"), plus: `app_platform` sees both tenants; `notqueue_api` without `set role` gets `permission denied` on every table; setting the context in one transaction leaves none in the next on the same pooled connection;
  - the catalog test, checked once with a throwaway table without RLS (then reverted);
  - venue checks: name without the default locale, default locale outside the enabled ones, `http://` privacy URL and a bad slug are rejected; `updated_at` changes on update;
  - `withTenantTransaction` with a non-UUID org ID fails before any query;
  - `db:seed` runs twice without duplicates.
- **E2E:** the existing suite; `/api/v1/health` still answers 200 when `DATABASE_URL` uses `notqueue_api` (checked locally and on the preview).
- **Manual:** the Stage 1 demo steps below on staging.

## Implementation steps
1. `feat(tenant): add tenancy domain types`: `src/core/tenancy/` with tests.
2. `feat(db): add organizations, venues and db roles`: schema, roles, policies, migration `0001`, outbox FK; local role password in `db:migrate`; `.env.example`.
3. `feat(db): add tenant-scoped transaction helpers`: `withTenantTransaction`, `withPlatformTransaction`, the two unit-of-work ports and adapters, wiring in `src/server/`.
4. `test(db): add two-tenant isolation harness`: seed helpers, `asTenant` / `asPlatform`, table registry, generated and catalog tests.
5. `build(deps): restrict transaction helpers by layer rules`: dependency-cruiser rules and fixtures.
6. `feat(db): add local demo seed`: `db:seed`.
7. `docs(tenant): document tenancy and stage 1 demo`: ADR links, layer READMEs, README, CLAUDE.md, `docs/demos/stage-1.md`, FEATURES.md.

After merge: the product owner sets the role password and `DATABASE_URL` (steps in the PR).

## Done when
- `pnpm check` is green locally and in CI, including the harness and the migration drift check.
- After merge, both migrate jobs apply `0001`; with `DATABASE_URL` on `notqueue_api`, production `/api/v1/health` answers 200.
- In the staging SQL editor (Stage 1 demo), inside `begin … rollback`: two organizations with a venue each are inserted; with `set local role app_tenant` and no context `app.venues` returns no rows, and with `app.org_id` set to the first organization only its venue; `set local role notqueue_api` then fails with `permission denied` on the same query.
- Baseline: lint, typecheck, unit, integration and E2E pass in CI; `docs:check` green and the `docs-reviewer` findings answered in the PR; the isolation harness exists and covers every tenant table (no endpoints yet); no UI strings.
- FEATURES.md (status, Progress, Next up) and `docs/demos/stage-1.md` updated.

## Risks and open questions
- **Supavisor and a custom login role:** the pooler user becomes `notqueue_api.<project-ref>`. Mitigation: check it on staging with the health endpoint before switching production; rollback is switching `DATABASE_URL` back (the code works with either user).
- **`grant ... with set true` needs Postgres 16+:** the local stack runs 17.11 and the hosted projects the same major; the migration test catches a mismatch locally, the staging migrate job before production.
- **A leaked `app.org_id` on a pooled connection** would be a cross-tenant read. Mitigation: only `set_config(..., true)` and `set local role`; an integration test reuses one connection across two transactions.
- **Policies get more complex in F-AUTH-RBAC** (venue scope, user context). The registry and generated tests are the place where each new rule is proven.
- **A slug can't be changed cheaply once printed on QR posters.** Changing it is an F-PUBLIC-VENUE / F-PLATFORM-CONSOLE concern; here it's only unique and well-formed.
- **ROADMAP Q4 (required contact fields):** answered by the product owner on 2026-11-12: phone is optional by default. Recorded in ROADMAP; the defaults for name and email are decision 4.

## Decisions (approved 2026-11-12)
All recommendations were accepted as proposed. Decisions 1 and 3 are recorded in [ADR-0022](../../adr/0022-database-roles-and-tenant-scoped-transactions.md).

1. **DB roles and tenant context (ADR):** recommended: the runtime connects as a login role `notqueue_api` that has no privileges of its own (`noinherit`) and switches per transaction with `set local role` to `app_tenant` or `app_platform`; the tenant is `app.org_id`, set with `set_config(..., true)`. A query that bypasses the helpers fails with `permission denied` instead of running as owner, which is what ADR-0005 asks for ("connects as a non-owner role"). Costs: one password per hosted project set by you, and `DATABASE_URL` switched in Vercel. Alternative: keep connecting as `postgres` and only `set local role` in the helpers (no ops change, but anything that skips the helpers runs with `bypassrls`).
2. **Platform role in this feature:** recommended: create `app_platform` and `withPlatformTransaction` now, since the harness must prove the boundary between the two roles and F-PLATFORM-CONSOLE and F-AUDIT-LOG build on it. Alternative: add both in F-PLATFORM-CONSOLE (the harness would cover only one role until then).
3. **Ports for use cases (ADR):** recommended: `TenantUnitOfWork.run(orgId, fn)` and `PlatformUnitOfWork.run(fn)`, which hand `fn` the adapters bound to the transaction (outbox now, repositories later), so `application` never sees Drizzle; the `platform` module is `src/application/platform/`, the only use-case folder allowed the platform port. Recorded in ADR-0022 with decision 1. Alternative: pass a raw `Tx` through an opaque type (simpler, but leaks infra into use cases).
4. **Contact-field defaults:** recommended: name `required` (staff call out the name, the fallback for the called moment), phone `optional` (your answer to Q4), email `hidden` (no email channel in v1, minimization). Alternative: name optional too.
5. **Locale codes not checked in SQL:** recommended, as in "Data model", to keep ADR-0019's "add a locale in one place". Alternative: a check constraint, with a migration per new locale.
6. **Seed scope:** recommended: `db:seed` for the local stack only; staging gets tenants through the operator console (F-PLATFORM-CONSOLE), which the Stage 1 demo shows. Alternative: also seed staging from the deploy workflow (demo data mixed with real migration runs).
7. **Venue defaults for locales:** recommended: `default_locale` `pl`, `enabled_locales` `{pl,en}`, browser language on. Alternative: only `{pl}` enabled until the admin turns on EN in F-VENUE-LOCALES.

## Deviations
Resolved during implementation (2026-11-12).

1. **The owner also gets SET on `notqueue_api`.** Without it, `postgres` (not a superuser on Supabase) can't `set role notqueue_api`, which demo step 3 and the harness need. It gains nothing: the owner already bypasses RLS.
2. **Hand-written SQL before and after the generated part of `0001`.** The roles and `app.current_org_id()` must exist before the generated policies, so they are prepended; grants, triggers and `FORCE ROW LEVEL SECURITY` are appended. drizzle-kit doesn't track either part, so the drift check is unaffected. `EXECUTE` on `app.current_org_id()` is granted explicitly.
3. **Generated constraint names:** the outbox FK is `outbox_events_org_id_organizations_id_fk` (drizzle-kit's name), not `outbox_events_org_id_fkey`; the venue checks have names (`venues_slug_format`, ...).
4. **An extra step for the venue mapper** (`feat(db): add venue row mapper`). It was in "Scope" and "Test plan" but had no step of its own; it also holds the venue constraint and `updated_at` tests.
5. **`asTenant` and `asPlatform` run in a savepoint that is always rolled back**, so an expected privilege error doesn't abort the test's transaction and the role can't leak into the rest of the test.
6. **The wiring is in `src/server/units-of-work.ts`**, beside `api.ts`, since no use case or route uses it yet.
7. **`/api/v1/health` as `notqueue_api` was not checked with `pnpm dev` locally** (running the dev server was blocked in the agent session). The role's login and its lack of privileges are covered by `isolation.int.test.ts`; the health check is Stage 1 demo step 5 after `DATABASE_URL` is switched.
8. **Exceptions in the boundary rules, beyond the plan's wording:** `withTransaction` is also allowed in `*.int.test.ts`, and importing only the `Tx` type is allowed anywhere (adapters such as the outbox take the caller's transaction); `withPlatformTransaction` is also allowed in `*.int.test.ts`; `PlatformUnitOfWork` is also imported by its adapter, `src/infra/db/unit-of-work.ts`, which implements it. None of these lets use cases reach across tenants.
9. **Harness checked against real breakage, locally only:** with `venues_tenant` changed to `using (true)` and a table `app.throwaway` without RLS added by hand, the read, no-context and catalog tests failed (3 of 40); `pnpm db:reset` restored the database. No commit records it, as nothing was changed in the repo.
10. **Staging before production for the role switch:** the health check on the role moved from the test plan to Stage 1 demo steps 5 (preview, staging database) and 6 (production), in that order.
11. **Stage 0 was closed in this PR** (demo steps 15 and 16 rerun here, hook label renamed), as agreed at the end of F-FOUND-DOCS-REVIEWER.

**After merge (product owner):** set the `notqueue_api` password in both Supabase projects and switch `DATABASE_URL` in Vercel (steps in the PR), Preview first, check its health (demo step 5), then Production, then run Stage 1 demo steps 1–6.
