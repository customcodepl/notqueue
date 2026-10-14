# ADR-0002: Hosting and database: Vercel + Supabase

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** [ADR-0003](0003-eu-regions-of-us-providers.md), [ADR-0005](0005-tenant-isolation-rls.md), [ADR-0007](0007-realtime-changed-signal.md), F-FOUND-PIPELINE, F-FOUND-DB

## Context
A solo developer builds a multi-tenant SaaS that needs relational data with strong tenant isolation, staff auth, real-time updates and EU data residency. Operational work (servers, backups, patching) should be close to zero, and every PR should get a preview deploy.

## Decision
We host the Next.js app on Vercel Pro (functions in `fra1`) and use Supabase in `eu-central-1` for Postgres, Auth and Realtime.

## Alternatives considered
- **MongoDB (Atlas):** no row-level security or relational model; tenant isolation would rely on application code alone.
- **VPS with Coolify:** we would own backups, patching and availability, and lose per-PR previews out of the box.
- **Neon + Pusher:** two vendors instead of one, auth chosen separately, and Pusher becomes another data processor whose EU setup needs extra checks.

## Consequences
- **Positive:** managed Postgres with RLS, auth and realtime from one EU-hosted vendor; compute and DB in the same region; preview deploys per PR.
- **Negative / accepted trade-offs:** dependence on two US-owned vendors (see [ADR-0003](0003-eu-regions-of-us-providers.md)); serverless limits shape the design (no long-lived connections, background work via outbox and cron).
- **Follow-ups:** keep the stack portable: standard Postgres, Drizzle migrations in the repo, Supabase used through adapters.
