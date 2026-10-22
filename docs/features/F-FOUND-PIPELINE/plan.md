# F-FOUND-PIPELINE: CI/CD & environments

- **Stage:** 0 (Foundations)
- **Status:** plan approved (2026-10-22)
- **Depends on:** F-FOUND-REPO (done)
- **Unblocks:** F-DESIGN-SYSTEM, F-EVENTS-OUTBOX, F-SEC-HARDENING
- **ADRs:** [ADR-0002](../../adr/0002-hosting-and-database.md), [ADR-0003](../../adr/0003-eu-regions-of-us-providers.md), [ADR-0006](../../adr/0006-transactional-outbox.md), [ADR-0009](../../adr/0009-gated-deploy-and-migration-pipeline.md) (superseded), [ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md)

## Goal
Every PR runs the full check suite in GitHub Actions, gets a validated Conventional Commit title and a Vercel preview URL in `fra1`. Every merge to `main` deploys to staging automatically and to production after a manual approval, with a migration step in front of each deploy. Errors reach Sentry EU without PII, and production has an uptime check.

## Scope
- **CI workflow** (`.github/workflows/ci.yml`), on pull requests and pushes to `main`:
  - Node from `.nvmrc`, pnpm via corepack, pnpm store cache, `HUSKY=0`;
  - `format:check`, `lint`, `typecheck`, `check:boundaries`, `test`, `build`;
  - `e2e` against a local production build (the existing Playwright `webServer`), Chromium and WebKit cached; the HTML report is uploaded as an artifact on failure;
  - `concurrency` cancels superseded runs on the same PR.
  - F-FOUND-DB adds the local Supabase stack and integration tests to this workflow; F-FOUND-I18N adds the missing-key gate.
- **PR-title check** (`.github/workflows/pr-title.yml`): runs commitlint with the repo's `commitlint.config.mjs` on the PR title (opened, edited, synchronize, reopened).
- **Action hygiene:** third-party actions pinned to a full commit SHA with the version in a comment; `.github/dependabot.yml` for the `github-actions` ecosystem only (weekly). Workflows declare minimal `permissions`.
- **Vercel project** (`fra1`):
  - `vercel.json`: `regions: ["fra1"]`; Git-integration deployments of `main` disabled (`git.deploymentEnabled.main: false`), so production only comes from the gated workflow. PR branches still get preview deployments from the Git integration.
  - Vercel environments: **Preview** (PR branches), custom environment **staging** (`main`, stable URL), **Production**. Preview and staging use the Supabase staging project; Production uses the Supabase production project.
  - Preview deployments keep Vercel Authentication on; device demos use a shareable link.
- **Deploy workflow** (`.github/workflows/deploy.yml`), on push to `main` and `workflow_dispatch`:
  1. waits for the CI checks of the commit;
  2. `migrate-staging` (GitHub environment `staging`);
  3. `deploy-staging`: `vercel pull` → `vercel build` → `vercel deploy --prebuilt --target=staging`;
  4. `migrate-production` (GitHub environment `production`, **required reviewer: product owner**, deployment branch `main` only);
  5. `deploy-production`: same as 3 with `--prod`;
  6. after each deploy, a smoke step requests the deployed URL and expects HTTP 200 and `fra1` in the `x-vercel-id` header.
  - Until F-FOUND-DB exists, the migrate jobs only check connectivity (`psql "$MIGRATIONS_DATABASE_URL" -c 'select 1'`) so the secrets and the approval gate are proven. F-FOUND-DB replaces that line with `pnpm db:migrate`.
  - `workflow_dispatch` from any branch runs only the staging half; production accepts `main` only.
- **Sentry** (`@sentry/nextjs`, EU org on `de.sentry.io`):
  - `src/instrumentation.ts` (server and edge init), `src/instrumentation-client.ts`, `src/app/global-error.tsx`;
  - errors only: no tracing, no Session Replay, bundle-size flags that drop tracing and replay code (customer JS budget in DESIGN.md);
  - `sendDefaultPii: false`; a `beforeSend` / `beforeBreadcrumb` scrubber in `src/infra/observability/` removes cookies, auth headers, query strings, request bodies, user data and breadcrumb URLs' query strings;
  - `environment` from `VERCEL_TARGET_ENV` (`preview`, `staging`, `production`; `development` locally, where Sentry is disabled without a DSN); `release` from `VERCEL_GIT_COMMIT_SHA`;
  - source maps uploaded at build time and not served publicly.
- **Uptime check:** a Sentry Uptime monitor on the production URL (home page now; switched to `/api/v1/health` in F-FOUND-API), alerting the product owner by email.
- **Cron:** only `CRON_SECRET` is provisioned in staging and production. The cron entry and the sweep endpoint come with F-EVENTS-OUTBOX (FEATURES finding C-4).
- **Branch protection on `main`:** required checks (CI jobs, PR title), squash merge only, no direct pushes, branch up to date before merge.
- **Docs:** this plan's secrets list (below); `docs/demos/stage-0.md`; README "Development" gains a CI/CD paragraph; CLAUDE.md Commands unchanged (no new scripts expected).

### Secrets and variables
| Where | Name | Kind | Purpose |
|---|---|---|---|
| GitHub repo | `VERCEL_TOKEN` | secret | Vercel CLI in the deploy workflow |
| GitHub repo | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | variables | Vercel CLI project link |
| GitHub repo | `PRODUCTION_HOST` | variable | Smoke-check target (`notqueue.vercel.app`) |
| GitHub repo | `SENTRY_AUTH_TOKEN` | secret | Source-map upload in `vercel build` (sensitive Vercel variables are not returned by `vercel pull`) |
| GitHub env `staging` | `MIGRATIONS_DATABASE_URL` | secret | Supabase staging, session pooler URL (IPv4) |
| GitHub env `production` | `MIGRATIONS_DATABASE_URL` | secret | Supabase production, session pooler URL (IPv4) |
| Vercel (all envs) | `NEXT_PUBLIC_SENTRY_DSN` | variable | Sentry ingest (EU) |
| Vercel (preview, staging, production) | `SENTRY_AUTH_TOKEN` | secret | Source-map upload during build |
| Vercel (staging, production) | `CRON_SECRET` | secret | Used from F-EVENTS-OUTBOX |

Sentry org and project slugs live in `next.config.ts` (not secret). Supabase app keys (URL, publishable and secret keys) are added by F-FOUND-DB / F-AUTH-LOGIN when code uses them.

### Product owner prerequisites (before step 4)
- Vercel Pro team, project imported from `customcodepl/notqueue`, custom environment `staging` created.
- Supabase projects `notqueue-staging` and `notqueue-prod` in `eu-central-1`.
- Sentry organization on the EU host, project `notqueue` (platform Next.js).
- The secrets and variables above, or a token I can use to set them with `gh` and the Vercel CLI (each with your approval).

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Local Supabase stack, migrations, `db:*` scripts, integration tests in CI | F-FOUND-DB |
| `/api/v1/health` (uptime target switch) | F-FOUND-API |
| Missing-translation-key CI gate | F-FOUND-I18N |
| Cron entry in `vercel.json`, sweep endpoint | F-EVENTS-OUTBOX |
| axe in CI, JS bundle budget check | F-DESIGN-SYSTEM |
| CSP and security headers (Sentry ingest host in `connect-src`) | F-SEC-HARDENING |
| Custom domain, alerting rules, runbook, point-in-time recovery | F-RELEASE-READINESS |
| Supabase branching (a database per PR) | Not planned (decision 2) |
| Performance tracing, Session Replay | Not planned in v1 (decision 6) |

## Affected modules
- **Repo config:** `.github/workflows/`, `.github/dependabot.yml`, `vercel.json`, `next.config.ts` (Sentry wrapper), `package.json` (`@sentry/nextjs`), `.env.example`.
- **app:** `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx`.
- **infra:** `src/infra/observability/` (Sentry options and the PII scrubber).
- **Docs:** this plan, `docs/demos/stage-0.md`, README, FEATURES.md, ROADMAP.md (prerequisites), new ADR-0009.

## Data model and API changes
None. No database or endpoints yet; the migrate jobs are connectivity checks until F-FOUND-DB.

## Conventions
- **GDPR / EU residency:** Vercel `fra1`, Sentry EU host; scrubber plus `sendDefaultPii: false`; no Replay. The repo is public, so CI logs and artifacts must never contain secrets or data (Playwright reports contain only test fixtures).
- **i18n:** `global-error.tsx` has one fallback sentence, exempt like the placeholder home page until F-FOUND-I18N translates it.
- **Layers:** the scrubber is pure and lives in `infra`; the instrumentation files are framework entry points (composition root) and only import it.
- **Commits:** PR titles validated in CI from this feature on.

## UI screens
None. `global-error.tsx` is a minimal unstyled fallback.

## Test plan
- **Unit:** the scrubber removes cookies, `authorization`, query strings, request bodies and `user` from a sample event and breadcrumb, and keeps the stack trace.
- **CI (on this PR):** all jobs green; a deliberately bad PR title (`update pipeline`) fails the title check, then the real title passes.
- **Preview:** this PR gets a Vercel preview URL; `x-vercel-id` shows `fra1`.
- **Sentry (manual):** a throwaway branch whose preview throws on the server and in the browser; both errors appear in Sentry EU with environment `preview`, readable stack traces, and no cookies, headers or query strings. The branch is then deleted.
- **Deploy (manual):** `workflow_dispatch` of the deploy workflow from this branch completes the staging half (connectivity check, deploy, smoke). After merge, the first `main` run waits for approval, then deploys production and the smoke step passes.
- **Uptime:** the monitor shows the production URL as up.

## Implementation steps
1. `ci: add ci workflow for checks, build and e2e`: `ci.yml`, action pinning, Dependabot.
2. `ci: validate pr titles with commitlint`: `pr-title.yml`.
3. `build: configure vercel project in fra1`: `vercel.json`; preview verified on the PR.
4. `feat(observability): report errors to sentry eu without pii`: SDK, instrumentation, scrubber with tests, `.env.example`.
5. `ci: add gated staging and production deploy workflow`: `deploy.yml` with migrate (connectivity), deploy and smoke jobs; verified with `workflow_dispatch` (staging).
6. `docs: add stage 0 demo and ci/cd notes`: `docs/demos/stage-0.md`, README, FEATURES, ROADMAP, ADR-0009 link.

Branch protection and the Sentry uptime monitor are settings, not commits; they are applied after step 5 and recorded in the PR description.

## Done when
- On this PR: CI and the PR-title check are green, and the preview URL serves from `fra1`.
- The staging half of the deploy workflow passes from `workflow_dispatch`; after merge, the gated production deploy and its smoke check pass.
- A test error reaches Sentry EU without PII; the uptime monitor is up.
- Branch protection on `main` is active.
- `docs/demos/stage-0.md` exists (steps for the parts available now; F-FOUND-API and F-FOUND-I18N add theirs).
- Baseline: lint, typecheck, unit and E2E tests pass **in CI** from now on.
- FEATURES.md updated (status, Progress, Next up).

## Risks and open questions
- **Production deploy is verified only after merge.** Mitigation: the staging half runs from `workflow_dispatch` before merge; if the first `main` run fails, a `fix` PR follows before any other feature.
- **Supabase direct connections are IPv6-only;** GitHub runners use IPv4. Use the session pooler URL for migrations (also what F-FOUND-DB needs for Drizzle migrations).
- **Vercel custom environments** need the Pro plan. If the `staging` environment isn't available, fall back to a preview deployment of `main` aliased to a stable staging hostname.
- **Sentry SDK size** on customer pages: errors-only with bundle-size flags is expected at roughly 25–30 KB gzip of the 100 KB budget. Measured in step 4 and reported; if it's too large, the client SDK is loaded lazily after first paint.
- **Public repository:** forks don't receive secrets, so external PRs get CI but no preview; logs are public. Acceptable for a solo project.
- No ROADMAP open question blocks this feature.

## Decisions (approved 2026-10-22)
All recommendations accepted as proposed. Decision 1 (with 2) is recorded in [ADR-0009](../../adr/0009-gated-deploy-and-migration-pipeline.md); decision 5 updates the ROADMAP Stage 0 prerequisites; decision 7 updates the FEATURES.md descriptions of this feature and F-EVENTS-OUTBOX.

1. **Deploy and migration flow (ADR):** recommended: previews from the Vercel Git integration; `main` deployed only by GitHub Actions in the order migrate staging → deploy staging → manual approval → migrate production → deploy production, using `vercel build` + `deploy --prebuilt`. Because migrations must run before the code that needs them, and only from one place. Alternatives: Vercel Git integration for production with migrations in the Vercel build step (runs on every preview build too, no approval); Supabase GitHub integration (ties migrations to Supabase tooling instead of Drizzle).
2. **Environment mapping (part of the ADR):** recommended: Preview and staging → Supabase staging; Production → Supabase production. A PR with a new migration runs its preview against staging before that migration is applied there; acceptable for a solo developer (migrations are additive and reviewed in the plan). Alternative: Supabase branching per PR (extra cost per branch, more moving parts).
3. **Production gate:** recommended: GitHub environment `production` with you as required reviewer. Alternative: deploy production on a release tag.
4. **E2E in CI:** recommended: against a local production build (deterministic, no secrets), plus a smoke check after each deploy. Alternative: full E2E against the preview URL (slower, needs Vercel protection bypass, flaky on cold starts).
5. **Uptime provider:** recommended: Sentry Uptime Monitoring, because it adds no new subprocessor. Alternative: Better Stack or UptimeRobot (a new subprocessor for the list in F-LEGAL-DOCS).
6. **Sentry scope:** recommended: errors only on server and client, no tracing and no Replay in v1 (JS budget and PII). Alternative: server tracing at a low sample rate now.
7. **Vercel Cron:** recommended: only `CRON_SECRET` here; the cron entry moves to F-EVENTS-OUTBOX, and the FEATURES.md description of this feature is updated. Alternative: a no-op cron now.
8. **Action pinning:** recommended: full SHAs plus Dependabot for `github-actions` only. Alternative: major-version tags (simpler, weaker supply-chain protection on a public repo).
9. **Production URL:** recommended: the default `*.vercel.app` URL until go-live; the custom domain comes in F-RELEASE-READINESS. Alternative: set up the domain now.
10. **Who sets up accounts and secrets:** recommended: you create the accounts and projects (prerequisites above); I set branch protection and secrets with `gh` and the Vercel CLI, each command approved by you. Alternative: you set everything in the web UIs from the table above.

### Clarifications (2026-10-22)
11. **Vercel plan:** the project starts on Hobby; moving to Pro is required before the first client (Vercel terms) and for Vercel Cron (F-EVENTS-OUTBOX).
12. **No staging deployment for now** ([ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md), accepted 2026-10-22, supersedes ADR-0009): the Supabase staging project and its migration step stay; PR previews serve as staging. The workflow sets `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production` for production builds, since `vercel build` in Actions may not provide `VERCEL_TARGET_ENV`.

## Deviations
_To be filled in after implementation._
