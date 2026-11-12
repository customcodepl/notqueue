# application

Use cases that orchestrate the domain: authorization checks, transactions, writing domain events to the outbox. Depends on ports (interfaces) that `infra` implements.

- **May import:** `core`.
- **Must not import:** `infra`, `api`, `app`, `i18n`.

## Folders
- `ports/`: interfaces that `infra` implements: `EventOutbox`, `DatabaseHealth`, `ErrorReporter`, and the units of work every database use case runs in: `TenantUnitOfWork` and `PlatformUnitOfWork` ([ADR-0022](../../docs/adr/0022-database-roles-and-tenant-scoped-transactions.md)).
- One folder per area for its use cases, e.g. `health/` (`checkHealth`, behind `/api/v1/health`).
- `platform/` (from F-PLATFORM-CONSOLE) is the `platform` module: the only use cases allowed `PlatformUnitOfWork`, so the only ones that may query across tenants.
