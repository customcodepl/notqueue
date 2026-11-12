# Stage 1 demo: Tenancy, auth & operator console

Run on the deployed app at the end of Stage 1 (see "Done when" in [ROADMAP.md](../ROADMAP.md#stage-1-tenancy-auth--operator-console)). Each feature adds its steps; features that are not done yet have no steps here.

Steps marked _automated_ are checked by Playwright specs that run against every PR preview; they count as run when the "Preview E2E" status is green on the preview of the stage's last PR ([ADR-0020](../adr/0020-stage-demos-partly-automated-on-previews.md)). Run every other step by hand.

## Setup
- Logged in to GitHub, Vercel (team NotQueue) and Supabase (staging and production projects).
- Docker running, for the local check (step 4).

## Steps and expected results

### Tenant model and RLS (F-TENANT-CORE)
1. In the "Deploy" run of the F-TENANT-CORE merge, open the "Migrate staging" and "Migrate production" logs.
   - **Expected:** `pnpm db:migrate` prints `Migrations applied.` in both jobs.
2. In the Supabase SQL editor of the staging project, run:
   ```sql
   begin;
   insert into app.organizations (id, name) values
     ('00000000-0000-4000-8000-00000000000a', 'Demo A'),
     ('00000000-0000-4000-8000-00000000000b', 'Demo B');
   insert into app.venues (org_id, slug, name, timezone) values
     ('00000000-0000-4000-8000-00000000000a', 'demo-a', '{"pl": "Lokal A"}', 'Europe/Warsaw'),
     ('00000000-0000-4000-8000-00000000000b', 'demo-b', '{"pl": "Lokal B"}', 'Europe/Warsaw');
   set local role app_tenant;
   select count(*) as without_context from app.venues;
   select set_config('app.org_id', '00000000-0000-4000-8000-00000000000a', true);
   select slug as tenant_a_sees from app.venues;
   rollback;
   ```
   - **Expected:** `without_context` is 0; `tenant_a_sees` lists only `demo-a`. Nothing is left behind (rollback).
3. In the same editor, run `begin; set local role notqueue_api; select count(*) from app.venues; rollback;`.
   - **Expected:** `permission denied for schema app`: the runtime role sees nothing without the tenant helper.
4. Locally: `pnpm db:start && pnpm db:migrate && pnpm test:integration`.
   - **Expected:** the isolation tests pass for `organizations`, `venues` and `outbox_events`, and the catalog test lists every table in `app` as registered with RLS forced.
5. After `DATABASE_URL` for Preview was switched to `notqueue_api`, redeploy the latest preview and open its `/api/v1/health`.
   - **Expected:** 200 with `"status": "ok"`. Only then switch Production.
6. Open https://notqueue.vercel.app/api/v1/health after `DATABASE_URL` for Production was switched to `notqueue_api` and production redeployed.
   - **Expected:** 200 with `"status": "ok"`; in the production SQL editor, `select usename, count(*) from pg_stat_activity where usename = 'notqueue_api' group by 1` shows the role's connections.

## Runs
| Date | Result | Notes |
|---|---|---|
