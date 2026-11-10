# api

The versioned HTTP API at `/api/v1` (Hono): routing, Zod contracts, OpenAPI, problem+json errors. Translates HTTP into `application` use cases and holds no business logic.

- **May import:** `application`, `core`, `i18n`.
- **Must not import:** `infra` or `src/server/`. Dependencies arrive through `createApi(deps)`, wired in the composition root ([ADR-0015](../../docs/adr/0015-composition-root.md)).

## Conventions ([ADR-0014](../../docs/adr/0014-api-conventions.md))
- Errors are `application/problem+json`: throw `ApiProblem(code)` with a code from the registry in `problems.ts`. Schema failures, unknown routes and unexpected errors are turned into problems by `app.ts`; every 5xx is reported through `ErrorReporter`.
- `detail` and `errors` reach the client: never put PII in them.
- Every response is `Cache-Control: no-store` and carries `x-request-id`.
- Time formats come from `schemas/time.ts`; responses that drive countdowns use `withServerTime`.

## Adding a route
1. In `routes/<name>.ts`, declare it with `createRoute` (Zod request and response schemas, the `Problem` schema for error responses) and export a handler factory that takes only the use cases it needs: `(deps) => RouteHandler<typeof route, ApiEnv>`.
2. Add those use cases to `ApiDeps` and register the route in `createApi` with `app.openapi(route, handler(deps))`.
3. Wire the real use cases in `src/server/api.ts` and fakes in `testing.ts`.
4. Test it with `createApi(fakeApiDeps(...)).request(...)`.
5. Run `pnpm api:spec` and commit the changed `docs/api/openapi.json`. A breaking change needs `/api/v2`.
