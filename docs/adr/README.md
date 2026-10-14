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
