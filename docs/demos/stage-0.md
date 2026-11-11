# Stage 0 demo: Foundations

Run on the deployed app at the end of Stage 0 (see "Done when" in [ROADMAP.md](../ROADMAP.md#stage-0-foundations)). Each feature adds its steps; steps marked _pending_ belong to features that are not done yet.

## Setup
- A GitHub account with access to `customcodepl/notqueue`, logged in to Vercel (team NotQueue) and Sentry (`customcode-tv`).
- A phone for the device checks.

## Steps and expected results

### CI and previews (F-FOUND-PIPELINE)
1. Open a small PR (e.g. a typo fix in a doc) with the title `update docs`.
   - **Expected:** the "Conventional Commit title" check fails with `type-empty` and `subject-empty`.
2. Rename it to `docs: fix typo`.
   - **Expected:** the title check passes; "Checks" and "Build and E2E" pass.
3. Open the preview URL from the Vercel comment on the PR, on the phone.
   - **Expected:** Vercel asks for login (Deployment Protection); after login the home page loads.
4. On the preview, open the browser console and run `setTimeout(() => { throw new Error("stage 0 demo") })`.
   - **Expected:** within a minute the error appears in Sentry, project `notqueue`, environment `preview`, with a readable stack trace and no user, cookies, headers or query string.

### Production deploy (F-FOUND-PIPELINE)
5. Merge the PR (squash). Open the "Deploy" workflow run on GitHub.
   - **Expected:** "Migrate staging" passes, then the run waits for approval in the `production` environment.
6. Approve the deployment.
   - **Expected:** "Migrate production" and "Deploy production" pass, including the smoke check.
7. Open https://notqueue.vercel.app on the phone.
   - **Expected:** the home page loads without a Vercel login.
8. Open the uptime monitor in Sentry.
   - **Expected:** production is shown as up.

### Database (F-FOUND-DB)
9. In the "Deploy" run from step 5, open the "Migrate staging" and "Migrate production" logs.
   - **Expected:** `pnpm db:migrate` prints `Migrations applied.` in both jobs.
10. In the Supabase dashboard of the staging and production projects, open the Table Editor and pick schema `app`.
    - **Expected:** the table `outbox_events` exists, with RLS enabled.
11. On a fresh clone with Docker running: `pnpm install && pnpm db:start && pnpm db:migrate && pnpm check`.
    - **Expected:** all checks pass, including the integration tests.

### API skeleton (F-FOUND-API)
12. Open https://notqueue.vercel.app/api/v1/health.
    - **Expected:** 200 JSON `{ "status": "ok", "serverTime": "…Z", "version": "<short SHA of main>", "region": "fra1" }`; headers `cache-control: no-store` and an `x-request-id` UUID.
13. Open https://notqueue.vercel.app/api/v1/openapi.json and https://notqueue.vercel.app/api/v1/nope.
    - **Expected:** the OpenAPI 3.1 document, equal to `docs/api/openapi.json` on `main`; the unknown path answers 404 `application/problem+json` with `code` `not_found` and `instance` = `urn:uuid:<x-request-id>`.
14. In the "Deploy" run from step 5, open the "Smoke check" log; then open the uptime monitor in Sentry.
    - **Expected:** the smoke check prints 200 with the deployed version and `fra1`; the monitor watches `/api/v1/health` and shows it as up.

### Documentation checks (F-FOUND-DOCS)
15. In Claude Code, on a branch that only adds a comment to a file in `src/infra/`, ask Claude to open a PR.
    - **Expected:** the first `gh pr create` is stopped by the hook with `src/infra/README.md (not changed in this branch)` and the changed file; Claude checks the README, writes in the PR's "Docs" section that it's still current, and the retry opens the PR. Close it without merging.
16. On any PR, add a broken relative link to a doc.
    - **Expected:** "Checks" fails at `pnpm docs:check` with the file, line and target.

### i18n (F-FOUND-I18N) — _pending_
17. The deployed app switches between PL and EN.
