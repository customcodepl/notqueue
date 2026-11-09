# F-FOUND-API: API skeleton

- **Stage:** 0 (Foundations)
- **Status:** plan approved (2026-11-09)
- **Depends on:** F-FOUND-REPO (done)
- **Unblocks:** F-AUTH-LOGIN, F-PUBLIC-VENUE (and, through them, every endpoint)
- **ADRs:** [ADR-0004](../../adr/0004-business-logic-in-own-api.md), [ADR-0005](../../adr/0005-tenant-isolation-rls.md), [ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md), [ADR-0013](../../adr/0013-database-access-with-node-postgres.md); [ADR-0014](../../adr/0014-api-conventions.md) (decision 1), [ADR-0015](../../adr/0015-composition-root.md) (decision 2)

## Goal
`GET /api/v1/health` and `GET /api/v1/openapi.json` respond on the deployed app from `fra1`. Every error the API returns is `application/problem+json`. The deploy smoke check and the Sentry uptime monitor use `/health`. Later features add endpoints by registering Zod-described routes on one Hono app, with a `Clock` port and shared schemas for every time format.

## Scope
- **Hono app** (`src/api/`):
  - `createApi(deps)` builds an `OpenAPIHono` app with base path `/api/v1`. Dependencies (use cases, `Clock`) are passed in, so `api` never imports `infra` and tests can pass fakes.
  - Routes are declared with `createRoute` (Zod request and response schemas). The route list is therefore introspectable, which the per-endpoint isolation suite in F-AUTH-RBAC needs.
  - Middleware, in this order: request ID (`x-request-id`, generated when missing or not a UUID, echoed in the response), `Cache-Control: no-store` on every response, error handler. F-AUTH-LOGIN adds authentication after the request ID.
  - No CORS headers: the web app is same-origin, and native apps don't need CORS.
- **Next.js entry point:** `src/app/api/v1/[[...route]]/route.ts` exports the HTTP methods via `hono/vercel` `handle()`, on the Node.js runtime (needed by `pg`). The same app can later run standalone with `@hono/node-server` (ADR-0004).
- **Composition root** (decision 2): a new `src/server/` folder wires `infra` adapters into `application` use cases and builds the API with them. Only Next.js entry points (route handlers, `instrumentation.ts`, and later Server Components) import it.
- **problem+json errors** (decision 1, RFC 9457):
  - Shape: `type` (`urn:notqueue:problem:<code>`), `title` (English, for developers), `status`, `code` (stable machine code, e.g. `validation_failed`), optional `detail` (no PII), `instance` (the request ID), and for validation errors `errors: [{ path, code }]`.
  - Clients translate by `code`; `title` and `detail` are never shown to end users, so the API holds no user-facing strings.
  - An `ApiProblem` error class plus a registry of codes in `src/api/problems.ts`. Built-in codes: `validation_failed` (400), `not_found` (404, also for a known path with an unsupported method, as Hono routes them), `internal_error` (500), `service_unavailable` (503).
  - Zod validation errors from route schemas become `validation_failed`. Unknown routes become `not_found`. Any other thrown error becomes `internal_error` with a generic `detail`; it's reported to Sentry with the request ID as a tag (the existing scrubber applies).
- **OpenAPI:**
  - `GET /api/v1/openapi.json`: OpenAPI 3.1 generated from the routes, with the problem schema as a shared component.
  - A committed snapshot `docs/api/openapi.json`. A test fails when the generated spec differs from it, so every contract change shows up in the PR diff and breaking changes are visible (decision 3).
  - No interactive docs UI yet (decision 4).
- **`GET /api/v1/health`** (decision 5):
  - Public, no tenant. A `checkHealth` use case in `application` with a `DatabaseHealth` port; `infra` implements it with `select 1` on `getDb()` and a 2-second timeout.
  - 200: `{ status: "ok", serverTime, version, region }`. `version` is the short commit SHA (`VERCEL_GIT_COMMIT_SHA`, `"dev"` locally), `region` is `VERCEL_REGION` (`"local"` locally).
  - 503: problem `service_unavailable` when the database check fails or times out. The cause goes to Sentry, not into the response.
  - This is the first runtime use of `DATABASE_URL`.
- **Time** (decision 6):
  - `core/time/clock.ts`: a `Clock` port (`now(): Date`) and a `FakeClock` for tests (set, advance). `core` keeps never reading the system clock.
  - `infra/time/system-clock.ts`: the real clock, wired in the composition root.
  - Shared Zod schemas in `src/api/schemas/time.ts`:
    - `Instant`: ISO 8601 UTC with `Z`, milliseconds optional on input, always emitted as `toISOString()`;
    - `LocalDate`: `YYYY-MM-DD`, a real calendar date;
    - `WallClockTime`: `HH:mm`, 00:00–23:59;
    - `DurationSeconds`: a non-negative integer;
    - `IanaTimeZone`: a name that `Intl` accepts (`Europe/Warsaw`; no fixed offsets such as `+01:00` or `Etc/GMT-1`);
    - `withServerTime(schema)`: adds `serverTime: Instant` to a response schema (CLAUDE.md: responses that drive countdowns include it).
  - Each schema has an OpenAPI description and example. `date-fns` and `@date-fns/tz` are not needed yet; they come with the first timezone arithmetic (F-TENANT-CORE or F-QUEUE-MODEL).
- **Boundaries:** dependency-cruiser rules for `src/server/` (may import every layer; only `src/app/` and `src/instrumentation.ts` may import it); `hono` stays forbidden in `core` and is now also forbidden in `application` and `infra`. The fixture gets one case per new rule. The `api` and `app` READMEs drop the "decided in F-FOUND-API" note.
- **Deploy and monitoring:**
  - `.github/scripts/smoke.sh` requests `/api/v1/health` and asserts 200, `region` = `fra1` and `version` = the deployed commit (closes deviation 8 of F-FOUND-PIPELINE).
  - The Sentry uptime monitor is switched to `/api/v1/health` (a setting).
- **Docs:** this plan, the new ADRs, `src/api/README.md` (how to add a route), `src/server/README.md`, CLAUDE.md (API conventions line), README, Stage 0 demo (step 12), FEATURES.md.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Authentication middleware, JWT, sessions | F-AUTH-LOGIN |
| Authorization middleware, per-endpoint isolation suite | F-AUTH-RBAC |
| Idempotency keys, per-IP rate limit | F-QUEUE-JOIN |
| Public venue endpoint, slug resolution | F-PUBLIC-VENUE |
| `date-fns` / `@date-fns/tz`, business-day calculation | F-TENANT-CORE / F-QUEUE-MODEL |
| Translated error messages in the UI | Each UI feature (maps `code` through next-intl) |
| Interactive API docs (Scalar or Swagger UI) | Later, with public API docs (after 1.0, integrations) |
| Security headers, CSP, CSRF and Origin checks | F-SEC-HARDENING |
| Request body size limits | F-QUEUE-JOIN (first public mutation) |

## Affected modules
- **core:** `src/core/time/clock.ts` (+ `FakeClock`).
- **application:** `src/application/health/check-health.ts`, `src/application/ports/database-health.ts`.
- **infra:** `src/infra/time/system-clock.ts`, `src/infra/db/database-health.ts`.
- **api:** `src/api/app.ts`, `src/api/problems.ts`, `src/api/middleware/`, `src/api/routes/health.ts`, `src/api/routes/openapi.ts`, `src/api/schemas/time.ts`, `src/api/schemas/problem.ts`.
- **server (new):** `src/server/api.ts` (composition root).
- **app:** `src/app/api/v1/[[...route]]/route.ts`.
- **Repo config:** `package.json` (`hono`, `@hono/zod-openapi`), `.dependency-cruiser.cjs` and fixtures, `.github/scripts/smoke.sh`, `.prettierignore` (the spec snapshot stays generator-formatted).
- **Docs:** see Scope.

## Data model and API changes
No migrations.

| Method | Path | Auth | Response | Errors |
|---|---|---|---|---|
| GET | `/api/v1/health` | public | 200 `Health`: `{ status: "ok", serverTime: Instant, version: string, region: string }` | 503 `service_unavailable` |
| GET | `/api/v1/openapi.json` | public | 200 OpenAPI 3.1 document | – |
| any | unknown path under `/api/v1` | – | – | 404 `not_found` |

Problem example:
```json
{
  "type": "urn:notqueue:problem:validation_failed",
  "title": "Request validation failed",
  "status": 400,
  "code": "validation_failed",
  "instance": "urn:uuid:3f0c9a2e-6a53-4c5e-9d43-5b1f0a7e2c11",
  "errors": [{ "path": "query.date", "code": "invalid_format" }]
}
```

## Conventions
- **API contracts:** Zod drives validation and OpenAPI; errors are problem+json; the snapshot makes breaking changes visible, and those need `/api/v2`.
- **Layers:** `api` gets dependencies through `createApi(deps)`; only `src/server/` imports `infra`; enforced by dependency-cruiser.
- **Time:** `Clock` port in `core`, system clock only in `infra`; instants exchanged as ISO 8601 UTC with `Z`; `serverTime` on `/health`; fake clock in tests. DST and midnight cases apply to the first wall-clock arithmetic, not to the format schemas here (they're covered where the arithmetic lives).
- **GDPR:** no PII in problems, logs or Sentry; request IDs are random UUIDs; `x-request-id` from the client is accepted only if it's a UUID.
- **i18n:** no user-facing strings in the API; clients translate problem `code`s. No UI in this feature.
- **Tenant isolation:** `/health` and `/openapi.json` are public and touch no tenant data; the isolation suite (F-TENANT-CORE harness) has nothing to cover yet.

## UI screens
None. This feature has no UI.

## Test plan
- **Unit (via `app.request()`, no server):**
  - `/health`: 200 with a fake clock (exact `serverTime`), `version` and `region` from env; 503 problem when the fake `DatabaseHealth` throws or exceeds the timeout.
  - problem+json: content type, shape and `instance` for a validation error, an unknown route, a thrown error (no stack or message leaked) and an unsupported method (404).
  - request ID: generated when missing, echoed when a valid UUID, replaced when not a UUID.
  - `Cache-Control: no-store` on success and error responses.
  - time schemas: valid and invalid inputs for each (e.g. `2026-02-30`, `24:00`, `2026-03-29T01:00:00+01:00`, `-5`, `Europe/Atlantis`, `Etc/GMT-1`); `FakeClock`.
  - OpenAPI: the generated spec equals `docs/api/openapi.json`; `pnpm api:spec` rewrites the snapshot.
- **Integration (local stack):** `infra` `DatabaseHealth` succeeds against the local database and fails within the timeout against an unreachable one.
- **Boundaries:** the fixture test covers the new rules.
- **E2E:** Playwright requests `/api/v1/health` and `/api/v1/openapi.json` on the production build (200, JSON content types).
- **Deploy (after merge):** the smoke check passes on production with `region` `fra1` and the deployed SHA; the uptime monitor shows `/api/v1/health` as up.
- **Preview (manual):** `/api/v1/health` on this PR's preview returns 200 from `fra1` against Supabase staging.

## Implementation steps
1. `feat(api): add clock port and time schemas`: `Clock`, `FakeClock`, `SystemClock`, `src/api/schemas/time.ts` with tests.
2. `feat(api): add hono app with problem+json errors`: `hono`, `@hono/zod-openapi`, `createApi`, middleware, problem registry and handler, tests.
3. `feat(api): add health endpoint`: use case, port, `infra` implementation with its integration test, route, composition root, Next.js route handler.
4. `feat(api): serve openapi spec with committed snapshot`: route, `api:spec` script, snapshot test.
5. `build(deps): add layer rules for the composition root`: dependency-cruiser rules, fixtures, READMEs.
6. `test(e2e): cover health and openapi endpoints`.
7. `ci(deploy): smoke check the health endpoint`: `smoke.sh`; uptime monitor switched (setting, recorded in the PR).
8. `docs(api): document api conventions`: ADR links, CLAUDE.md, README, Stage 0 demo, FEATURES.md.

## Done when
- On this PR's preview, `/api/v1/health` and `/api/v1/openapi.json` respond, `/health` from `fra1`.
- After merge, the production smoke check passes on `/health` with `region` `fra1` and the deployed SHA; the uptime monitor watches `/health`.
- CI is green, including the snapshot test and the boundary fixture test.
- Stage 0 demo step 12 is filled in.
- Baseline: lint, typecheck, unit, integration and E2E tests pass in CI; no tenant endpoints, so no isolation tests yet; no UI strings.
- FEATURES.md updated (status, Progress, Next up).

## Risks and open questions
- **Next.js 16 with `cacheComponents`:** route handlers may be treated as static or reject segment config such as `dynamic`. Mitigation: `/health` reads request-time data (env, database), which keeps it dynamic; checked in step 3 with `next build` output (the route must be marked dynamic, `ƒ`).
- **`/health` opens database connections** every uptime check (about once a minute) and on every smoke check. That's negligible for the pooler; a cold function adds a connection setup to the first check.
- **`@hono/zod-openapi` with Zod 4:** the peer range supports Zod 4, but some schema features (e.g. refinements) can't be expressed in OpenAPI. Mitigation: refinements carry a `description`, and the snapshot shows what's emitted.
- **Exposing `version` and `region` on a public endpoint** reveals the commit SHA. The repository is public, so that discloses nothing new.
- No ROADMAP open question blocks this feature.

## Decisions (approved 2026-11-09)
All recommendations accepted as proposed. Decision 1 is recorded in [ADR-0014](../../adr/0014-api-conventions.md) and decision 2 in [ADR-0015](../../adr/0015-composition-root.md).

1. **API conventions (ADR):** recommended: RFC 9457 problems with a stable `code`, `type` as `urn:notqueue:problem:<code>`, `instance` = request ID, `errors[]` for validation; developer-facing `title` only, clients translate `code`; `Cache-Control: no-store` by default; `serverTime` as a field via `withServerTime`, not in a response envelope or header. These apply to every endpoint and are costly to change once clients exist. Alternatives: `type` as an HTTPS URL (needs a stable domain, which comes only at go-live); translated `title` on the server (the API would need the user's locale and would hold UI strings); an envelope `{ data, serverTime }` on every response (more noise for endpoints that don't need it).
2. **Composition root (ADR):** recommended: a new `src/server/` folder that alone imports `infra` and builds use cases and the API; `api` gets dependencies through `createApi(deps)`; only Next.js entry points import `src/server/`. It keeps `api` and `app` free of `infra` (the current rule) and makes the API testable with fakes. Alternatives: allow `api` and `app` to import `infra` directly (simpler, but every route could bypass ports); a DI container library (more machinery than a solo project needs).
3. **OpenAPI snapshot:** recommended: commit `docs/api/openapi.json` and fail the test on any difference, regenerated with `pnpm api:spec`. Alternative: generate only at runtime (contract changes stay invisible in review).
4. **API docs UI:** recommended: none for now; the JSON spec is enough for one developer, and a UI loads third-party scripts that the CSP (F-SEC-HARDENING) would have to allow. Alternative: Scalar at `/api/v1/docs`, outside production only.
5. **`/health` checks the database:** recommended: yes, `select 1` with a 2-second timeout and 503 on failure, so the uptime monitor and smoke check catch a broken `DATABASE_URL`, pooler or TLS setup. Alternative: liveness only (the function answers even when every real endpoint would fail).
6. **Clock and `serverTime`:** recommended: `serverTime` comes from the function's `Clock` (`SystemClock`, NTP-synced on Vercel, so within milliseconds of the database clock); stored instants keep coming from the database `now()`. Alternative: read `now()` from the database for every response (one more query per request, or a transaction even for reads).
7. **Request ID:** recommended: accept a client `x-request-id` only if it's a UUID, otherwise generate one; echo it in the response, the problem `instance` and Sentry tags. Alternative: always generate (loses correlation with client logs).

## Deviations
_To be filled in after implementation._
