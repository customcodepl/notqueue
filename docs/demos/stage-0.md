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

### API skeleton (F-FOUND-API) — _pending_
9. `/api/v1/health` and the OpenAPI spec respond; `x-vercel-id` on `/api/v1/health` contains `fra1`.

### i18n (F-FOUND-I18N) — _pending_
10. The deployed app switches between PL and EN.
