# F-FOUND-PREVIEW-E2E: Preview E2E and automated demo steps

- **Stage:** 0 (Foundations)
- **Status:** in implementation; plan approved 2026-11-11
- **Depends on:** F-FOUND-PIPELINE, F-FOUND-I18N
- **Unblocks:** none directly; every later stage demo writes its automatable steps as preview specs
- **ADRs:** [ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md) (previews serve as staging); [ADR-0020](../../adr/0020-stage-demos-partly-automated-on-previews.md) (decision 1)

## Goal
Every PR preview runs the Playwright suite against the deployed URL (`fra1`, Supabase staging), and the stage demo scripts mark which steps that run covers, so a person runs only the steps that need a real device, a third-party UI or judgment.

## Scope
- **Playwright against a deployed URL** (`playwright.config.ts`):
  - `PLAYWRIGHT_BASE_URL` set: no `webServer`; `baseURL` is that URL; tests tagged `@local` are skipped.
  - `PLAYWRIGHT_BASE_URL` not set (today's local and CI run): tests tagged `@preview` are skipped.
  - Untagged tests run in both. Same three projects (desktop Chromium, mobile and tablet WebKit).
  - On a deployed URL, `trace` is off and only failure screenshots are kept (see Risks: the bypass cookie).
- **Protection bypass:** a Playwright global setup requests the preview once with `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie: true`, and saves the resulting storage state (Vercel's host-only cookie) for every test. It fails with a clear message on 401/403 (missing or wrong secret). The secret is never sent as `extraHTTPHeaders`, which would also send it to Sentry ingest.
- **Specs:**
  - `e2e/api.spec.ts`: the 503 test becomes `@local`; a new `@preview` test checks that `/api/v1/health` answers 200 with `status` `ok`, `version` = the short SHA of the deployed commit (`EXPECTED_VERSION`), `region` `fra1`, `cache-control: no-store` and an `x-request-id`.
  - `e2e/i18n.spec.ts`, `e2e/smoke.spec.ts`, the OpenAPI and 404 tests: unchanged, run in both.
- **Script:** `pnpm e2e:preview` (`playwright test` with the deployed-URL settings; needs `PLAYWRIGHT_BASE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`, `EXPECTED_VERSION`).
- **Workflow** `.github/workflows/preview-e2e.yml`, job "Preview E2E":
  - `on: deployment_status`; runs only when the state is `success` and the environment is a Vercel Preview.
  - Checks out `github.event.deployment.sha`; same Playwright container as CI; URL from `deployment_status.environment_url`.
  - Secret `VERCEL_AUTOMATION_BYPASS_SECRET` (repository secret, set by you); uploads the report on failure.
  - Concurrency per deployed ref, superseded runs cancelled.
- **Demo scripts:**
  - `docs/demos/stage-0.md`: steps 17–19 marked _Automated: Preview E2E_ with the test names; one manual step stays: the home page on a real phone in Polish, switch once.
  - The header explains the convention: a step is _automated_ when a `@preview` or untagged spec checks its expected result; the rest is manual.
- **Process docs:** ROADMAP baseline definition of done (stage demo), CLAUDE.md rule 5 and Commands, README CI line, PR template "Checks".
- **Secret setup:** click-by-click steps for you in the PR (Vercel → GitHub) and a non-secret check.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Claude Code QA subagent (exploratory runs of demo scripts, visual and longest-locale checks) | Revisit with F-DESIGN-SYSTEM, when there is real UI to judge |
| Specs that write data on the preview (test tenants, cleanup on Supabase staging) | The first feature whose demo writes data (Stage 1) |
| E2E on production after the deploy | None: the smoke check stays ([ADR-0010](../../adr/0010-deploy-pipeline-without-staging-deployment.md)) |
| Automating demo steps 1–16 (PR-title and `docs:check` failures, Sentry event, deploy approval, Supabase dashboard) | None: they need GitHub/Sentry/Supabase UIs or a deliberate failure; their logic is unit-tested already |
| Preview E2E as a required status check | Decision 4; revisit once it has been stable for a stage |

## Affected modules
- Repo config: `playwright.config.ts`, `e2e/` (global setup, tags), `package.json`, `.github/workflows/preview-e2e.yml`, `.github/pull_request_template.md`.
- Docs: `docs/demos/stage-0.md`, `docs/ROADMAP.md`, `CLAUDE.md`, `README.md`, `docs/FEATURES.md`, new ADR.
- No application code.

## Data model and API changes
None. No migrations, no endpoints; the specs only read.

## Conventions
- **GDPR:** no PII is involved; the bypass secret stays in GitHub secrets, and no trace or report contains it or the bypass cookie.
- **Data residency:** tests hit the `fra1` preview and Supabase staging only; GitHub runners send no data elsewhere.
- **i18n:** the existing specs check both catalogs on the deployed build.
- **Action pinning:** full SHAs, as in `ci.yml`.

## UI screens
None.

## Test plan
- **Local:** `pnpm e2e` still passes unchanged (`@preview` skipped); `pnpm check` green.
- **On this PR:** after you set the secret, "Preview E2E" runs on this PR's preview and passes in all three projects.
- **Negative checks (on this PR, then reverted or rerun):**
  - a wrong `EXPECTED_VERSION` fails the health test;
  - a missing secret fails the global setup with the 401 message, not with timeouts.
- **Artifact check:** the uploaded report of the failing run contains no trace and no `_vercel_jwt` cookie.

## Implementation steps
1. `docs(ci): plan preview e2e`: this plan, the ADR, FEATURES.
2. `test(e2e): run the suite against a deployed url`: config switch, tags, bypass global setup, `@preview` health test, `pnpm e2e:preview`.
3. `ci: run e2e against vercel previews`: the workflow; verified on this PR once the secret is set.
4. `docs(demos): mark automated demo steps`: stage-0 demo, ROADMAP, CLAUDE.md, README, PR template.

## Done when
- "Preview E2E" is green on the preview of the first PR after merge, in all three projects, and the negative checks failed as expected (deviation 1).
- Demo steps 17–19 are marked automated, the manual phone step stays.
- Baseline definition of done: lint, typecheck, unit, integration and E2E pass in CI; docs current (`pnpm docs:check`, doc-map review). No UI strings.

## Risks and open questions
- **Bypass cookie in artifacts:** the repository is public, so workflow artifacts are readable by any GitHub user. A Playwright trace records cookies and would leak access to all previews. Mitigation: `trace: "off"` on deployed URLs; the artifact check in the test plan.
- **One run per Vercel status:** Vercel posts `pending` and then `success`; each triggers the workflow. The job-level `if` skips the `pending` run, which shows up as a skipped check. That is one reason for decision 4.
- **Which workflow file runs:** for `deployment_status`, GitHub should use the workflow at the deployed commit, so this PR can test itself. If it turns out to need the default branch, the first real run is after merge (as in F-FOUND-PIPELINE, deviation 2) and a failure is fixed in a `fix` PR first.
- **Vercel plan:** Protection Bypass for Automation is expected on the current plan; it's checked when you create the secret. If it's missing, the feature stops and we decide again.
- **Cold starts:** the first function call on a fresh preview is slow. CI keeps `retries: 2`, and the health test uses a longer timeout.
- **Staging writes later:** today's specs only read. Stage 1 specs that create tenants or users on Supabase staging need a naming and cleanup rule; that belongs to the first feature that does it.

## Decisions (approved 2026-11-11)
All six approved as recommended.
1. **Stage demos partly automated ([ADR-0020](../../adr/0020-stage-demos-partly-automated-on-previews.md)):** recommended: demo steps with a deterministic, browser- or HTTP-observable result are Playwright specs that run on every PR preview; the demo script marks them _automated_, and a stage's demo counts as run when "Preview E2E" is green on the preview of the stage's last PR and the manual steps were done. It changes the baseline definition of done for every stage and reverses F-FOUND-PIPELINE decision 4. Alternatives: keep every step manual (the demo grows with each stage and is run only once, late); a Claude Code QA agent per PR (costly, not deterministic).
2. **Trigger:** recommended: `deployment_status` from the Vercel Git integration, because it fires exactly when the preview is ready and carries its URL. Alternative: a job in `ci.yml` that polls for the preview URL (a third-party action or Vercel API token, and wasted runner minutes).
3. **Getting past Vercel Authentication:** recommended: Vercel's Protection Bypass for Automation secret as a GitHub repository secret, exchanged once for the bypass cookie in global setup. Alternatives: turn off protection on previews (exposes staging to anyone with the URL); shareable links (expire, created by hand).
4. **Required check:** recommended: not required in branch protection for now; the PR template and the definition of done require it green. A required check can be satisfied by the skipped `pending` run, and a PR with no preview would be stuck. Alternative: required from day one.
5. **One suite with tags:** recommended: one `e2e/` suite where `@local` and `@preview` mark the few environment-specific tests. Alternative: a separate `e2e-preview/` suite (duplicates the i18n and API tests).
6. **Placement:** recommended: a new Stage 0 feature, F-FOUND-PREVIEW-E2E, before F-TENANT-CORE, because the Stage 1 demo is the first long one. Stage 0 progress becomes 6/7 and v1.0 6/42. Alternative: fold it into F-TENANT-CORE (mixes a process change into a data feature).

## Deviations
1. **Trigger is `repository_dispatch`, not `deployment_status`** (decision 2 changed, approved 2026-11-11). The project sends no `deployment_status` events: GitHub has no Vercel Preview deployments, only a `Vercel` commit status that links to the Vercel dashboard. Vercel now recommends `repository_dispatch`; `vercel.deployment.success` carries `url` and `git.sha`. Consequences:
   - The workflow always runs from `main`, so it is verified on the first PR after merge (as in F-FOUND-PIPELINE, deviation 2); a failure is fixed in a `fix` PR before any other feature.
   - The run belongs to `main`, so it doesn't show on the PR by itself: the workflow writes a "Preview E2E" commit status on the deployed commit (`pending`, then the result; `statuses: write`).
   - It fires only on success, so there is no skipped `pending` run; the risk under decision 4 no longer applies, the "not required for now" reason that remains is stability.
   - Production deployments (`environment` `production`) are skipped; `workflow_dispatch` (URL + SHA) reruns it, and is how the wrong-version negative check is run (URL of one preview, SHA of another commit).
   - [ADR-0020](../../adr/0020-stage-demos-partly-automated-on-previews.md) was corrected on this branch before reaching `main` instead of being superseded (approved 2026-11-11).
2. **A separate `playwright.preview.config.ts`** instead of an environment switch in `playwright.config.ts`: `pnpm e2e:preview` fails at once without `PLAYWRIGHT_BASE_URL`, instead of quietly building and testing locally.
3. **Without the secret Vercel redirects to its login page, which answers 200**, not 401. The global setup checks that the final host is still the preview. Verified locally against the PR #16 preview without the secret: the run stops in setup with "redirected to https://vercel.com: VERCEL_AUTOMATION_BYPASS_SECRET is missing or wrong."
4. **Demo:** step 17 stays manual (real phone, Polish, one switch), steps 18–19 are automated, and a new step 20 checks the "Preview E2E" status itself.
