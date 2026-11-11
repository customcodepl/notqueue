# application

Use cases that orchestrate the domain: authorization checks, transactions, writing domain events to the outbox. Depends on ports (interfaces) that `infra` implements.

- **May import:** `core`.
- **Must not import:** `infra`, `api`, `app`, `i18n`.

## Folders
- `ports/`: interfaces that `infra` implements: `EventOutbox`, `DatabaseHealth`, `ErrorReporter`.
- One folder per area for its use cases, e.g. `health/` (`checkHealth`, behind `/api/v1/health`).
