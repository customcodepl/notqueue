# application

Use cases that orchestrate the domain: authorization checks, transactions, writing domain events to the outbox. Depends on ports (interfaces) that `infra` implements.

- **May import:** `core`.
- **Must not import:** `infra`, `api`, `app`, `i18n`.
