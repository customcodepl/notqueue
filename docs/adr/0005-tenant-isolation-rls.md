# ADR-0005: Tenant isolation: shared schema, RLS and tenant-scoped transactions

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** [ADR-0004](0004-business-logic-in-own-api.md), F-FOUND-DB, F-TENANT-CORE, F-PLATFORM-CONSOLE

## Context
Many organizations share one deployment. A leak of one venue's customer data to another would be a GDPR breach. Application-level scoping alone fails on a single missing `where` clause.

## Decision
All tenants share one schema and every tenant row has an `org_id`. Isolation is enforced twice: application-level scoping and Postgres Row-Level Security. The API connects as a non-owner role and runs each request in a transaction that sets the tenant context transaction-locally. Operator access uses a separate, audited role.

## Alternatives considered
- **Schema or database per tenant:** migrations and connections multiply with each tenant; overkill at this scale.
- **Application scoping only:** no safety net for bugs.

## Consequences
- **Positive:** a missed filter returns no rows instead of another tenant's data; the setup is cheap to run.
- **Negative / accepted trade-offs:** RLS policies must be written and tested for every table; transaction-local context is required with pooled connections.
- **Follow-ups:** all DB access goes through the tenant-scoped transaction helper; every endpoint is covered by the cross-tenant isolation suite; cross-tenant queries only in the `platform` module.
