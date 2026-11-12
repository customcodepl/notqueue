# Architecture decision records

Decisions that affect more than one feature or the whole system and are costly to reverse. Feature-local decisions live in each plan's "Decisions" section. Start a new ADR from [TEMPLATE.md](TEMPLATE.md).

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | accepted | 2026-10-13 |
| [0002](0002-hosting-and-database.md) | Hosting and database: Vercel + Supabase | accepted | 2026-10-11 |
| [0003](0003-eu-regions-of-us-providers.md) | EU regions of US-owned providers, with a portability exit | accepted | 2026-10-11 |
| [0004](0004-business-logic-in-own-api.md) | Business logic in our own API layer | accepted | 2026-10-11 |
| [0005](0005-tenant-isolation-rls.md) | Tenant isolation: shared schema, RLS and tenant-scoped transactions | accepted | 2026-10-11 |
| [0006](0006-transactional-outbox.md) | Transactional outbox for domain events | accepted | 2026-10-11 |
| [0007](0007-realtime-changed-signal.md) | Supabase Realtime Broadcast as a "changed" signal | accepted | 2026-10-11 |
| [0008](0008-hashed-entry-tokens.md) | Unguessable entry tokens, stored hashed | accepted | 2026-10-11 |
| [0009](0009-gated-deploy-and-migration-pipeline.md) | Gated deploy and migration pipeline | superseded by 0010 | 2026-10-22 |
| [0010](0010-deploy-pipeline-without-staging-deployment.md) | Deploy pipeline without a staging deployment | accepted | 2026-10-22 |
| [0011](0011-database-access-and-pooling.md) | Database access: Drizzle and postgres.js over the Supavisor transaction pooler | superseded by 0013 | 2026-11-04 |
| [0012](0012-integration-tests-on-supabase-local-stack.md) | Integration tests on the Supabase local stack | accepted | 2026-11-04 |
| [0013](0013-database-access-with-node-postgres.md) | Database access: Drizzle and node-postgres over the Supavisor transaction pooler | accepted | 2026-11-04 |
| [0014](0014-api-conventions.md) | API conventions: problem+json with stable codes, no-store, `serverTime` field | accepted | 2026-11-09 |
| [0015](0015-composition-root.md) | Composition root in `src/server/` | accepted | 2026-11-09 |
| [0016](0016-documentation-checks-per-pull-request.md) | Documentation checks per pull request | superseded by 0017 | 2026-11-11 |
| [0017](0017-documentation-review-before-opening-a-pull-request.md) | Documentation review before opening a pull request | superseded by 0021 | 2026-11-11 |
| [0018](0018-locale-resolved-per-request-without-locale-in-url.md) | Locale resolved per request, without the locale in the URL | accepted | 2026-11-11 |
| [0019](0019-locales-and-localized-text-in-core.md) | Supported locales and `LocalizedText` in `core` | accepted | 2026-11-11 |
| [0020](0020-stage-demos-partly-automated-on-previews.md) | Stage demos partly automated on PR previews | accepted | 2026-11-11 |
| [0021](0021-documentation-review-by-a-reviewer-agent.md) | Documentation review by a reviewer agent | accepted | 2026-11-12 |
| [0022](0022-database-roles-and-tenant-scoped-transactions.md) | Database roles and tenant-scoped transactions | accepted | 2026-11-12 |
