# core

Pure domain: entities, value objects, state machines, domain events and policies (e.g. ETA, ticket numbering).

- **May import:** nothing outside `core`.
- **Must not import:** framework or I/O packages (`next`, `react`, `drizzle-orm`, `@supabase/*`, `hono`).
- Never reads the system clock: time comes from an injected `Clock` or a parameter.
- Fully unit-testable without mocks of infrastructure.
