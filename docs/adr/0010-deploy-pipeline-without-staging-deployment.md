# ADR-0010: Deploy pipeline without a staging deployment

- **Status:** accepted
- **Date:** 2026-10-22
- **Related:** supersedes [ADR-0009](0009-gated-deploy-and-migration-pipeline.md); [ADR-0002](0002-hosting-and-database.md), F-FOUND-PIPELINE, F-FOUND-DB, F-RELEASE-READINESS

## Context
ADR-0009 deploys `main` to a staging deployment before the production approval. Before go-live there are no users and no migrations yet, the Vercel project is on the Hobby plan (no custom environments), and a staging deployment would need a protected preview behind an alias plus a protection-bypass secret for its smoke check. PR previews already run against the Supabase staging project.

## Decision
We keep ADR-0009's single migration path and approval gate but drop the staging deployment: migrate staging → manual approval (GitHub environment `production`) → migrate production → deploy production. PR previews from the Vercel Git integration serve as staging, and stage demos run on them.

## Alternatives considered
- **Keep the staging deployment (ADR-0009):** an extra build and alias on every merge, and extra secrets, for a check that has little to catch before there are users or data migrations.
- **No staging database:** previews would need the production database or none at all.

## Consequences
- **Positive:** fewer moving parts and secrets; the production smoke check runs against the unprotected production domain.
- **Negative / accepted trade-offs:** the exact build that goes to production is first seen on production; code merged from several PRs and the migrated staging database are not checked together before the approval.
- **Follow-ups:** reintroduce a staging deployment (custom Vercel environment on Pro) before the first client in F-RELEASE-READINESS, or earlier once migrations start changing existing data.
