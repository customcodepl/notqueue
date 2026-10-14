# ADR-0003: EU regions of US-owned providers, with a portability exit

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** [ADR-0002](0002-hosting-and-database.md), F-LEGAL-DOCS, F-GDPR-DATA

## Context
All data must be stored and processed in the EU. The chosen providers (Vercel, Supabase, Sentry) are US-owned, so even with EU regions they may be subject to US access laws. Transfers currently rely on the EU-US Data Privacy Framework (DPF), which may be challenged before the CJEU like Safe Harbor and Privacy Shield were.

## Decision
We use the EU regions of US-owned providers (Vercel `fra1`, Supabase `eu-central-1`, Sentry EU), covered by DPAs with SCCs in addition to DPF. We keep the stack portable so that it can move to EU-owned providers if the legal basis changes or a client requires it.

## Alternatives considered
- **EU-owned providers from day one** (e.g. Hetzner, OVHcloud, Scaleway): more ops work and no equivalent of Vercel previews or managed Supabase; slower delivery for a solo developer.
- **Rely on DPF alone:** a single point of legal failure.

## Consequences
- **Positive:** fast delivery on managed services while keeping data in the EU.
- **Negative / accepted trade-offs:** residual legal risk from US ownership, which must be disclosed in the subprocessor list.
- **Follow-ups:**
  - Portability: standard Postgres with Drizzle migrations in the repo, self-hostable Supabase, a Hono API that can run standalone, realtime and notification channels behind adapters, roles in our own tables.
  - Review this decision whenever the legal basis for transfers changes (e.g. a CJEU ruling on DPF).
