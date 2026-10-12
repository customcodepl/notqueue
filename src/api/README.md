# api

The versioned HTTP API at `/api/v1` (Hono): routing, Zod contracts, OpenAPI, problem+json errors. Translates HTTP into `application` use cases and holds no business logic.

- **May import:** `application`, `core`, `i18n`.
- **Must not import:** `infra`. How the composition root wires `infra` in is decided in F-FOUND-API.
