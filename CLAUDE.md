# CLAUDE.md

## Project
notqueue is a multi-tenant SaaS for virtual queues and waitlists at venues (restaurants, car service shops, other service businesses).
- End customers join from their phone through a QR code or a link, with no account, and track their position and ETA live.
- Staff manage the queue on a real-time tablet dashboard.
- Venue admins configure venues and staff; the platform operator manages tenants.
- Stack: Next.js (App Router), TypeScript, Tailwind, Hono API at `/api/v1`, Drizzle, Supabase (Postgres, Auth, Realtime) in `eu-central-1`, Vercel `fra1`.
- All data stays in the EU.

## Docs: what to read and when
| Doc | Read it |
|---|---|
| [README.md](README.md) | First, in every new session: product scope, stack, architecture, GDPR assumptions |
| [docs/FEATURES.md](docs/FEATURES.md) | **Before starting any feature**: IDs, status, dependencies, happy paths |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Before planning a feature: its stage, scope and the **baseline definition of done** |
| [docs/DESIGN.md](docs/DESIGN.md) | **Before any UI work**: surface principles, tokens, components, accessibility, the called moment |
| `docs/features/<feature-id>/plan.md` | Before implementing or changing that feature |
| [docs/adr/](docs/adr/README.md) | Before changing anything an ADR covers, and when a plan touches architecture, hosting, data residency or security |

## Workflow rules
1. **Pick the next feature.** "Next up" in `docs/FEATURES.md` has two tracks.
   - **Code track:** take its item. If there is none, take the first `planned` feature (lowest stage, then table order) whose dependencies are all `done`, skipping product-track features.
   - **Product track** (design decisions, mockups, legal documents): work on it only when I ask. It never blocks the code track until a code feature depends on it.
2. **Check dependencies first.** Before starting a feature, read the relevant docs and confirm in `docs/FEATURES.md` that every dependency is `done`. If any isn't, **stop and tell me**.
3. **Plan before code.** Every feature starts with `docs/features/<feature-id>/plan.md`, following [docs/features/TEMPLATE.md](docs/features/TEMPLATE.md).
   - Before writing it, read:
     - the open questions in ROADMAP whose **Blocks:** names the feature;
     - the features that depend on this one, for what they need from it;
     - the "Deviations" sections in its dependencies' plans;
     - the ADRs that cover the areas the feature touches.
   - Set the plan state to `drafted` in "Next up" and list the decisions I need to make. Mark every decision that meets rule 7 with **(ADR)**.
   - When I approve, set it to `approved` and record my answers in the plan (and in ROADMAP if they resolve an open question). Write the ADRs for the decisions marked **(ADR)** as `accepted` in the same branch.

   **No code until I approve the plan.**
4. **Small steps.** Implement in small increments. After each one, run lint, typecheck and tests, and fix any failures before moving on.
5. **Close out the feature.**
   - Update the stage's demo script `docs/demos/stage-<n>.md` if the feature adds to the stage demo. Steps with a deterministic result in a browser or over HTTP become Playwright specs that run on the preview, and the script marks them _automated_ ([ADR-0020](docs/adr/0020-stage-demos-partly-automated-on-previews.md)).
   - Set its status in `docs/FEATURES.md`, and update the "Progress" and "Next up" sections there.
   - Update ROADMAP or README if anything changed.
   - Keep `pnpm docs:check` green. Before `gh pr create`, run the `docs-reviewer` agent on the branch (a hook stops the first attempt and asks for it; this is a standing request to spawn it), fix each finding or say in the PR's "Docs" section why it needs no change ([ADR-0021](docs/adr/0021-documentation-review-by-a-reviewer-agent.md)). Run `gh pr create` as a command of its own.
   - List any deviations from the plan in your summary and in the plan's "Deviations" section.
   - If a deviation changes a decision covered by an ADR, or makes a new decision that meets rule 7, write the ADR (superseding the old one if needed).
   - Check it against the baseline definition of done in ROADMAP.md.
6. **Don't diverge silently.** If implementation shows that the plan or the docs are wrong, stop and propose a doc change before continuing. If it contradicts an accepted ADR, stop and propose a superseding ADR instead.
7. **Record architecture decisions.** Write an ADR in `docs/adr/` (from [TEMPLATE.md](docs/adr/TEMPLATE.md)) when a decision
   - affects more than one feature or the whole system, **and**
   - is costly to reverse, or its rationale and rejected alternatives are worth keeping.

   Feature-local choices stay in the plan's "Decisions". An ADR starts as `proposed`; I approve it, then it becomes `accepted`.
   Accepted ADRs are not edited except for status and links. To change a decision, write a new ADR that supersedes it.
   When an ADR resolves a ROADMAP open question, mark the question "Resolved → ADR-NNNN". Plans link to ADRs instead of repeating their rationale.

## Communication
- Reply to me in **Polish**.
- Write all code, comments, commit messages, PR descriptions and docs in **English**.

## Commands
Setup on a fresh clone: `corepack enable && pnpm install` (also installs the commit-msg hook), then `pnpm exec playwright install chromium webkit` once for E2E. Integration tests and `pnpm check` need Docker and the local Supabase stack: `pnpm db:start && pnpm db:migrate`.
```
dev:              pnpm dev
build:            pnpm build
lint:             pnpm lint              # --max-warnings=0; pnpm lint:fix to autofix
format:           pnpm format            # pnpm format:check to verify; *.md is not formatted
typecheck:        pnpm typecheck
check:boundaries: pnpm check:boundaries  # layer rules (dependency-cruiser)
docs:check:       pnpm docs:check        # links, paths, commands, ADR index, progress counts, layer READMEs, secrets table
docs:map:         pnpm docs:map          # docs mapped to this branch's changes, a hint for the docs reviewer (ADR-0021)
i18n:check:       pnpm i18n:check        # every key in every locale, valid ICU, same arguments, complete plurals
test:             pnpm test              # unit + integration; test:unit (no Docker), test:integration, test:coverage, test:watch
e2e:              pnpm e2e               # Playwright: builds and serves on port 3100
e2e:preview:      pnpm e2e:preview       # same suite against a deployment: PLAYWRIGHT_BASE_URL, VERCEL_AUTOMATION_BYPASS_SECRET, EXPECTED_VERSION
check:            pnpm check             # lint + typecheck + boundaries + docs + i18n + all tests
db:start:         pnpm db:start          # local Supabase stack (Docker, default ports 543xx); db:stop to stop
db:generate:      pnpm db:generate       # create a migration from src/infra/db/schema; --custom for hand-written SQL
db:migrate:       pnpm db:migrate        # apply migrations (local stack unless MIGRATIONS_DATABASE_URL is set)
db:reset:         pnpm db:reset          # wipe the local database and re-apply migrations
db:seed:          pnpm db:seed           # one demo tenant on the local stack (refuses hosted databases)
api:spec:         pnpm api:spec          # rewrite docs/api/openapi.json after a contract change (a test compares it)
```
Integration tests (`*.int.test.ts`) run on real Postgres with RLS in the local stack and roll back each test ([ADR-0012](docs/adr/0012-integration-tests-on-supabase-local-stack.md)). Migrations are forward-only; never edit one that has been applied to staging.

## Conventions that apply to every change
- **Tenant isolation.**
  - Every tenant table has `org_id` (the tenant root `organizations` is scoped by `id`) and an RLS policy, and is in the isolation harness registry (`src/infra/db/testing/tenant-tables.ts`).
  - All DB access goes through `withTenantTransaction` (use cases: `TenantUnitOfWork`), or for operator work `withPlatformTransaction` (`PlatformUnitOfWork`); the runtime role `notqueue_api` has no privileges of its own ([ADR-0022](docs/adr/0022-database-roles-and-tenant-scoped-transactions.md)).
  - Every new endpoint must be covered by the cross-tenant isolation suite.
  - Never query across tenants outside the `platform` module (the `platform/` use cases in `application`, through `PlatformUnitOfWork`).
- **Business logic lives in the API layer.**
  - Layers: `core` (pure domain) → `application` (use cases) → `infra` → `api` / `app`.
  - `src/server/` is the composition root: the only place that wires `infra` into use cases and the API; only Next.js entry points import it ([ADR-0015](docs/adr/0015-composition-root.md)).
  - Clients never query Supabase directly. All client mutations go through `/api/v1`.
  - Server Components may call `application/` with the same auth context.
- **API contracts.**
  - Zod schemas drive validation and OpenAPI. Routes are declared with `createRoute` and get their use cases through `createApi(deps)`; only the composition root in `src/server/` wires `infra` in ([ADR-0015](docs/adr/0015-composition-root.md)).
  - Errors are problem+json with a stable `code` from the registry in `src/api/problems.ts`; clients translate by `code`, `title` and `detail` are for developers ([ADR-0014](docs/adr/0014-api-conventions.md)).
  - Responses are `Cache-Control: no-store` by default and carry `x-request-id`.
  - Every contract change updates the committed `docs/api/openapi.json` (`pnpm api:spec`). Breaking changes need a new API version.
- **i18n.**
  - No hardcoded user-facing strings; everything goes through next-intl, in every enabled locale.
  - Venue content uses `LocalizedText`.
- **Time.**
  - Instants are `timestamptz` in UTC, set by the database (`now()` in the transaction), not by the function's clock.
  - Timezones are IANA names (`Europe/Warsaw`), never fixed offsets.
  - API format: instants as ISO 8601 UTC with `Z`; calendar dates as `YYYY-MM-DD`; wall-clock times as `HH:mm` plus the venue timezone; durations as integer seconds. Responses that drive countdowns include `serverTime`.
  - Opening hours are stored as local wall-clock times plus the venue timezone, never converted to UTC.
  - "Today" means the venue's **business day**, which starts at the venue's `business_day_start` (default 04:00 local), not at midnight. Ticket numbering and daily stats use it.
  - `core` never reads the system clock; time comes from an injected `Clock` or a parameter.
  - Arithmetic in timezones uses `date-fns` + `@date-fns/tz`. Display goes only through the formatters in `src/i18n/format.ts` (next-intl underneath; lint blocks other date formatting), always in the venue's timezone; 12h/24h follows the locale.
  - Customer-facing ETAs are ranges rounded to 5 minutes.
  - Tests use a fake clock and cover the DST switches (last Sunday of March and October) and hours that cross midnight.
- **UI.**
  - Use DESIGN.md tokens and components only (no ad-hoc colors or sizes).
  - Meet the accessibility target.
  - Check phone and tablet sizes and the longest locale.
- **State changes** go through the domain state machine and write a domain event to the outbox in the same transaction.
- **GDPR.**
  - No PII in logs, URLs, realtime payloads, outbox payloads or Sentry.
  - Collect only the contact fields the venue requires.
  - Entry tokens are stored hashed.
- **Notifications** go through a `NotificationChannel` adapter, never as direct provider calls from use cases.
- **Migrations** are versioned and forward-only, and are reviewed as part of the plan.

## Branches and pull requests
- One branch per feature, from an up-to-date `main`: `<type>/<feature-id-lowercase>`, e.g. `feat/f-queue-join` or `chore/f-found-repo`. Small doc-only changes outside a feature use `docs/<short-topic>`.
- One PR per feature into `main`. The PR title is a Conventional Commit (validated in CI from F-FOUND-PIPELINE on) and becomes the squash commit message.
- Merge with **squash**. I review and merge; you never merge.
- Commits inside the branch follow the plan's implementation steps.

## Commits
- Follow [Conventional Commits](https://www.conventionalcommits.org): `<type>(<scope>): <subject>`.
- Allowed types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`.
- **Scope** is the affected module or area (e.g. `queue`, `auth`, `i18n`, `api`, `ui`, `db`). Omit it only for repo-wide changes.
- **Subject:** imperative, lowercase, no trailing period. The whole header (`<type>(<scope>): <subject>`) is at most 72 characters (enforced by commitlint).
- **Body** (when useful): what and why, not how.
- **Footer:** `Refs: <feature-id>` (from FEATURES.md). Use `BREAKING CHANGE:` for breaking changes.
- One logical change per commit, made only after lint, typecheck and tests pass. Never commit secrets.
- Commit each step of an approved plan without asking once its checks pass, and mention the commit briefly. Ask before any other commit.
- **Never push, open a PR or merge without my explicit approval.** `.claude/settings.json` makes the harness ask for `git push` and `gh pr create`/`merge`, and denies force-pushes.

## Secrets
- I set secrets and credential env vars (Vercel, GitHub environments, Supabase) myself. Give me exact click-by-click steps and a non-secret way to verify; never ask me to paste a value into the chat.
- For credential checks, give a command that prompts for the password locally (e.g. `docker exec -it supabase_db_notqueue psql "...?sslmode=require"`; there is no local `psql`).
- Never read `.env` files other than `.env.example` (denied in `.claude/settings.json`).
