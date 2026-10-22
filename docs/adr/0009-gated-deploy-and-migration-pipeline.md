# ADR-0009: Gated deploy and migration pipeline

- **Status:** superseded by [ADR-0010](0010-deploy-pipeline-without-staging-deployment.md)
- **Date:** 2026-10-22
- **Related:** [ADR-0002](0002-hosting-and-database.md), [ADR-0003](0003-eu-regions-of-us-providers.md), F-FOUND-PIPELINE, F-FOUND-DB

## Context
Database migrations must be applied before the code that needs them is deployed, exactly once and from a single place. Vercel's Git integration deploys every push on its own, so a production deploy can run ahead of its migration, and running migrations inside the Vercel build would also run them from preview builds. A solo developer needs per-PR previews and a manual stop before production, with no extra infrastructure.

## Decision
We keep the Vercel Git integration for PR previews only. `main` is deployed only by GitHub Actions, in this order: migrate staging → deploy staging → manual approval (GitHub environment `production`) → migrate production → deploy production, using `vercel build` and `vercel deploy --prebuilt`. Previews and staging use the Supabase staging project; production uses the Supabase production project.

## Alternatives considered
- **Vercel Git integration for production, migrations in the Vercel build step:** migrations would also run from preview builds, with no approval step.
- **Supabase GitHub integration:** ties migrations to Supabase tooling instead of the Drizzle migrations in the repo (portability, ADR-0003).
- **Supabase branching (a database per PR):** extra cost per branch and more moving parts than a solo project needs.
- **Production on a release tag:** an extra manual step with no benefit over an approval gate.

## Consequences
- **Positive:** migrations always precede the code that needs them; one migration path for staging and production; production changes only after an explicit approval.
- **Negative / accepted trade-offs:** a PR preview with a new migration runs against staging before that migration is applied, so migrations must stay backward compatible (additive first); production deploys wait for a person.
- **Follow-ups:** F-FOUND-DB plugs `pnpm db:migrate` into the migrate jobs; the runbook in F-RELEASE-READINESS documents deploy, approval and rollback.
