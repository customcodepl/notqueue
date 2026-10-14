# ADR-0004: Business logic in our own API layer

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** [ADR-0005](0005-tenant-isolation-rls.md), [ADR-0007](0007-realtime-changed-signal.md), F-FOUND-API

## Context
Supabase lets clients query Postgres directly through its Data API, with RLS as the only guard. The product needs a queue state machine, outbox events in the same transaction, rate limits and an API that native apps and integrations can use later.

## Decision
All business logic lives in our own versioned REST API (`/api/v1`, Hono with Zod and OpenAPI), layered as `core` → `application` → `infra` → `api` / `app`. Clients never query Supabase directly; Server Components may call `application/` with the same auth context.

## Alternatives considered
- **Client-to-Supabase queries with RLS:** logic spread across clients and SQL policies, no single place for state transitions and outbox writes, and the schema becomes a public contract.
- **Postgres functions (RPC) for logic:** hard to test and version, and ties logic to Supabase.

## Consequences
- **Positive:** one tested domain model; a stable contract for web, mobile and integrations; no dependence on the Supabase Data API.
- **Negative / accepted trade-offs:** every read goes through a function, adding latency and more code than direct queries.
- **Follow-ups:** the `app` schema is not exposed through the Data API; layer rules are enforced by dependency-cruiser.
