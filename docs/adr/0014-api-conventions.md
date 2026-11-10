# ADR-0014: API conventions: problem+json with stable codes, no-store, `serverTime` field

- **Status:** accepted
- **Date:** 2026-11-09
- **Related:** [ADR-0004](0004-business-logic-in-own-api.md), F-FOUND-API, F-AUTH-LOGIN, F-QUEUE-JOIN, F-QUEUE-STATUS, every endpoint

## Context
`/api/v1` is a public contract for the web app now and for native apps and integrations later ([ADR-0004](0004-business-logic-in-own-api.md)). CLAUDE.md fixes problem+json for errors and requires `serverTime` in responses that drive countdowns, but leaves out the details: how clients recognize an error, who translates its message, how a response correlates with logs, and how queue data is kept out of caches. Once clients depend on these details, changing them is a breaking change.

## Decision
- **Errors** are RFC 9457 problems with a stable machine `code`. `type` is `urn:notqueue:problem:<code>`, `instance` is the request ID, and validation errors carry `errors: [{ path, code }]`.
- **Messages:** `title` and `detail` are English and meant for developers only. Clients show translated messages chosen by `code`, so the API holds no user-facing strings.
- **Caching:** every response defaults to `Cache-Control: no-store`.
- **Request IDs:** each request has an ID (`x-request-id`; a client value is accepted only if it's a UUID). The ID is echoed in the response and used as a Sentry tag.
- **Server time:** responses that drive countdowns include a `serverTime` field (`withServerTime`), not a response envelope or a header.

## Alternatives considered
- **`type` as an HTTPS URL:** needs a stable domain, which exists only at go-live; a URN never moves.
- **Server-side translated `title`:** the API would need the user's locale on every request and would hold UI strings.
- **An envelope `{ data, serverTime }` on every response:** adds noise for endpoints that don't drive countdowns.
- **Caching allowed by default:** risks serving queue positions or personal data from a shared cache.

## Consequences
- **Positive:** one error format for web, mobile and integrations; translations stay in next-intl; responses correlate with logs and Sentry; no stale queue data from caches.
- **Negative / accepted trade-offs:** every new error case needs a registered `code` and client translations; endpoints that could be cached must opt in explicitly.
- **Follow-ups:** codes live in a registry in `src/api/problems.ts`; UI features map codes through next-intl; the committed OpenAPI snapshot makes contract changes visible in review.
