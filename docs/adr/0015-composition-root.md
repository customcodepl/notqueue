# ADR-0015: Composition root in `src/server/`

- **Status:** accepted
- **Date:** 2026-11-09
- **Related:** [ADR-0004](0004-business-logic-in-own-api.md), [ADR-0013](0013-database-access-with-node-postgres.md), F-FOUND-REPO, F-FOUND-API, every feature with use cases

## Context
The layer rules keep `api` and `app` from importing `infra`, so routes can't bypass the ports defined in `application` (F-FOUND-REPO). Some code still has to create the real adapters (database, clock, later realtime and notification channels) and hand them to use cases and the HTTP layer. Without a fixed place for that wiring, each route would build its own dependencies, or the rule would erode one exception at a time.

## Decision
A single composition root in `src/server/` imports `infra`, `application` and `api`, creates the adapters, and builds the use cases and the Hono app. The app is built with `createApi(deps)`, so `api` receives its dependencies as arguments. Only Next.js entry points import `src/server/`: route handlers, `instrumentation.ts` and, later, Server Components. dependency-cruiser enforces these rules.

## Alternatives considered
- **Allow `api` and `app` to import `infra`:** simpler, but any route could talk to the database directly and skip the use cases.
- **A dependency-injection container library:** more machinery and indirection than a solo project needs; plain functions are enough.
- **Wiring inside each route handler:** duplicated setup and no single place to swap an adapter.

## Consequences
- **Positive:** ports stay the only path from presentation to infrastructure; the API can be tested with fakes through `createApi`; adapters can be swapped in one place (portability, [ADR-0003](0003-eu-regions-of-us-providers.md)).
- **Negative / accepted trade-offs:** each new use case or adapter must also be wired in `src/server/`.
- **Follow-ups:** Server Components that call `application` get their use cases from `src/server/` with the same auth context (F-AUTH-LOGIN).
