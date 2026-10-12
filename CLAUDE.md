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

## Workflow rules
1. **Pick the next feature.** "Next up" in `docs/FEATURES.md` has two tracks.
   - **Code track:** take its item. If there is none, take the first `planned` feature (lowest stage, then table order) whose dependencies are all `done`, skipping product-track features.
   - **Product track** (design decisions, mockups, legal documents): work on it only when I ask. It never blocks the code track until a code feature depends on it.
2. **Check dependencies first.** Before starting a feature, read the relevant docs and confirm in `docs/FEATURES.md` that every dependency is `done`. If any isn't, **stop and tell me**.
3. **Plan before code.** Every feature starts with `docs/features/<feature-id>/plan.md`, following [docs/features/TEMPLATE.md](docs/features/TEMPLATE.md).
   - Before writing it, read:
     - the open questions in ROADMAP whose **Blocks:** names the feature;
     - the features that depend on this one, for what they need from it;
     - the "Deviations" sections in its dependencies' plans.
   - Set the plan state to `drafted` in "Next up" and list the decisions I need to make.
   - When I approve, set it to `approved` and record my answers in the plan (and in ROADMAP if they resolve an open question).

   **No code until I approve the plan.**
4. **Small steps.** Implement in small increments. After each one, run lint, typecheck and tests, and fix any failures before moving on.
5. **Close out the feature.**
   - Update the stage's demo script `docs/demos/stage-<n>.md` if the feature adds to the stage demo.
   - Set its status in `docs/FEATURES.md`, and update the "Next up" section there.
   - Update ROADMAP or README if anything changed.
   - List any deviations from the plan in your summary and in the plan's "Deviations" section.
   - Check it against the baseline definition of done in ROADMAP.md.
6. **Don't diverge silently.** If implementation shows that the plan or the docs are wrong, stop and propose a doc change before continuing.

## Communication
- Reply to me in **Polish**.
- Write all code, comments, commit messages, PR descriptions and docs in **English**.

## Commands
Setup on a fresh clone: `corepack enable && pnpm install` (also installs the commit-msg hook), then `pnpm exec playwright install chromium webkit` once for E2E.
```
dev:              pnpm dev
build:            pnpm build
lint:             pnpm lint              # --max-warnings=0; pnpm lint:fix to autofix
format:           pnpm format            # pnpm format:check to verify; *.md is not formatted
typecheck:        pnpm typecheck
check:boundaries: pnpm check:boundaries  # layer rules (dependency-cruiser)
test:             pnpm test              # unit; pnpm test:coverage for coverage
e2e:              pnpm e2e               # Playwright: builds and serves on port 3100
check:            pnpm check             # lint + typecheck + boundaries + unit tests
db:start:         TODO   # local Supabase (F-FOUND-DB)
db:generate:      TODO   # create a migration (F-FOUND-DB)
db:migrate:       TODO   # apply migrations (F-FOUND-DB)
```
Integration tests (real Postgres with RLS) are added to `test` in F-FOUND-DB.

## Conventions that apply to every change
- **Tenant isolation.**
  - Every tenant table has `org_id` and an RLS policy.
  - All DB access goes through the tenant-scoped transaction helper.
  - Every new endpoint must be covered by the cross-tenant isolation suite.
  - Never query across tenants outside the `platform` module.
- **Business logic lives in the API layer.**
  - Layers: `core` (pure domain) → `application` (use cases) → `infra` → `api` / `app`.
  - Clients never query Supabase directly. All client mutations go through `/api/v1`.
  - Server Components may call `application/` with the same auth context.
- **API contracts.**
  - Zod schemas drive validation and OpenAPI.
  - Errors are problem+json.
  - Breaking changes need a new API version.
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
  - Arithmetic in timezones uses `date-fns` + `@date-fns/tz`. Display goes only through next-intl formatters, always in the venue's timezone; 12h/24h follows the locale.
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
- Commit only when I ask or the approved plan says so. **Never push without my explicit approval.**
