# F-FOUND-REPO: Repository & tooling

- **Stage:** 0 (Foundations)
- **Status:** plan approved (2026-10-11)
- **Depends on:** none
- **Unblocks:** F-FOUND-PIPELINE, F-FOUND-DB, F-FOUND-API, F-FOUND-I18N

## Goal
A clean repository skeleton where a fresh clone, after one install command, can run dev, build, lint, typecheck, unit tests, E2E tests and layer-boundary checks, all green. Commit messages are enforced as Conventional Commits locally.

## Scope
- **Framework:** Next.js (App Router, latest stable) with `src/` layout, React, Tailwind CSS v4.
- **TypeScript:** `strict`, plus `noUncheckedIndexedAccess`, and a path alias `@/*` → `src/*`.
- **Runtime and package manager:**
  - pnpm (pinned via the `packageManager` field);
  - Node 24 (Active LTS), pinned in `.nvmrc` and in `engines`. Moving to Node 26 after it becomes Active LTS is a separate `chore`.
- **Code quality:**
  - ESLint flat config (Next.js rules plus TypeScript rules);
  - Prettier with the Tailwind class-sorting plugin;
  - `.editorconfig`.
- **Layer skeleton:** `src/core`, `src/application`, `src/infra`, `src/api`, `src/app`, `src/i18n`. Each has a short `README.md` describing its responsibility and allowed imports (per CLAUDE.md).
- **Layer-boundary checks with dependency-cruiser:**
  - `core` imports nothing from other layers, and no framework or I/O packages (`next`, `react`, `drizzle-orm`, `@supabase/*`, `hono`).
  - `application` may import only `core`.
  - `infra` may import `core` and `application`.
  - `api` and `app` may import `application` and `core`. Their access to `infra` (composition root) is decided in F-FOUND-API.
  - `i18n` belongs to the presentation side: only `api` and `app` may import it, and it may import only `core`. `core`, `application` and `infra` never import `i18n`.
  - No circular dependencies.
- **Unit tests (Vitest):** node environment, coverage via v8, and one sample test of a trivial pure helper in `core`. That test is replaced by real domain tests in F-QUEUE-MODEL.
- **E2E tests (Playwright):**
  - projects for desktop Chromium, a mobile WebKit profile (iPhone, as an iOS Safari approximation) and a tablet profile (iPad);
  - one smoke test that loads the home page;
  - `webServer` runs `next build && next start` on a fixed port, with `reuseExistingServer` locally. Running against preview URLs in CI is decided in F-FOUND-PIPELINE.
- **Conventional Commits:**
  - commitlint with `@commitlint/config-conventional`, overridden to match CLAUDE.md;
  - `type-enum` limited to `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`;
  - lower-case subject and scope, `header-max-length` 72;
  - a husky `commit-msg` hook runs commitlint, and the hook is installed via the `prepare` script.
- **Housekeeping:** `.gitignore` (`.next`, `node_modules`, `.env*` except `.env.example`, `coverage`, `playwright-report`, `test-results`) and an empty `.env.example` with a header comment.
- **Scripts:** `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `test`, `test:watch`, `e2e`, `check:boundaries`, `check`. The `check` script runs lint, typecheck, boundaries and unit tests.
- **Placeholder home page:** minimal, unstyled, no design (see Risks for i18n).
- **CLAUDE.md:** fill in the Commands section for these scripts. The DB commands stay TODO.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| GitHub Actions, PR-title validation, Vercel, Sentry, uptime | F-FOUND-PIPELINE |
| Drizzle, Supabase, migrations, DB commands | F-FOUND-DB |
| Hono, `/api/v1`, OpenAPI | F-FOUND-API |
| next-intl, message catalogs, `LocalizedText` | F-FOUND-I18N |
| Design tokens, fonts, components, axe checks | F-DESIGN-SYSTEM |
| Pre-commit hooks for lint or format (lint-staged) | Not planned. See decision 3 |

## Affected modules
- **Repo root:** `package.json`, lockfile, `tsconfig.json`, `next.config.*`, ESLint, Prettier, dependency-cruiser, Vitest, Playwright and commitlint configs, `.husky/`, `.nvmrc`, `.editorconfig`, `.gitignore`, `.env.example`.
- **Skeleton:** `src/` with the layer folders, plus `src/app/layout.tsx`, `src/app/page.tsx` and Tailwind's global CSS.
- `e2e/` (Playwright tests) and `tools/depcruise-fixtures/` (deliberate violation fixture).
- `CLAUDE.md` (Commands section).

## Data model and API changes
None.

## UI screens
Only an unstyled placeholder home page. It isn't covered by DESIGN.md: the design decisions are pending until Stage 2, and the page will be replaced.

## Test plan
- **Unit:** the sample `core` test passes under `pnpm test`.
- **Boundaries:**
  - `pnpm check:boundaries` passes on `src/`;
  - an automated test runs dependency-cruiser against `tools/depcruise-fixtures/` (where `core` imports from `infra`) and expects a violation, which proves the rules work.
- **E2E:** `pnpm e2e` loads the home page in all three Playwright projects.
- **Commit hook (manual check):**
  - a commit with message `update stuff` is rejected;
  - `chore: verify commit hook` is accepted (on a throwaway branch, then deleted).
- **Clean clone:** `git clone` → `pnpm install` → `pnpm check && pnpm build && pnpm e2e` is all green.

## Implementation steps
Run the checks that exist so far after each step.
1. Scaffold Next.js with TS, Tailwind, App Router and `src/`. Pin Node and pnpm. Add `.gitignore`, `.editorconfig` and `.env.example`.
2. Tighten the TS config; add the `typecheck` script.
3. Set up ESLint and Prettier; add the `lint` and `format` scripts.
4. Add the layer folders with READMEs; dependency-cruiser rules, the fixture and its test.
5. Vitest with the sample `core` test.
6. Playwright with three projects and the smoke test.
7. commitlint and the husky `commit-msg` hook.
8. Add the `check` script; fill in the CLAUDE.md Commands section; run the clean-clone check.

## Done when
- The clean-clone check passes.
- The commit hook rejects non-conforming messages.
- The dependency-cruiser fixture test proves that violations are caught.
- The CLAUDE.md Commands section is filled in (except DB).
- FEATURES.md is updated: F-FOUND-REPO is `done`, and "Next up" points to the next feature.

## Risks
- **Hardcoded placeholder text vs the i18n convention.** CLAUDE.md forbids hardcoded user-facing strings, but next-intl only arrives in F-FOUND-I18N. The placeholder page is exempt and gets replaced in F-FOUND-I18N.
- **Tool versions.** Latest Next.js, Tailwind v4 and ESLint flat config may need small config adjustments. Use the officially documented setups and pin exact versions in the lockfile.
- **Husky in CI and on Vercel.** The `prepare` script must not fail where `.git` is missing or hooks aren't wanted. Use husky's recommended guard and set `HUSKY=0` in CI (handled in F-FOUND-PIPELINE).
- **Playwright WebKit vs real iOS Safari.** It's an approximation only. Testing on real devices stays part of the baseline definition of done from Stage 2.

## Decisions (approved 2026-10-11)
1. **Package manager:** pnpm.
2. **Lint and format:** ESLint + Prettier.
3. **Pre-commit hook:** no lint-staged for now. `pnpm check` plus CI (F-FOUND-PIPELINE) is the gate; locally only the commit-msg hook.
4. **`Refs:` footer:** not enforced by commitlint; it stays a CLAUDE.md convention.
5. **Node version:** Node 24 (amended 2026-10-11; was "current Active LTS at implementation time").

### Clarifications (2026-10-11)
6. **`src/i18n` boundary:** a presentation-side module (see Scope).
7. **Commit header length:** `header-max-length` 72 covers the whole header; CLAUDE.md now says the same.
8. **Playwright server:** `next build && next start`, not `next dev`.

## Deviations
_To be filled in after implementation._
