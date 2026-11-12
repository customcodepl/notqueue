# core

Pure domain: entities, value objects, state machines, domain events and policies (e.g. ETA, ticket numbering).

- **May import:** nothing outside `core`.
- **Must not import:** framework or I/O packages (`next`, `react`, `drizzle-orm`, `@supabase/*`, `hono`).
- Never reads the system clock: time comes from an injected `Clock` or a parameter.
- Fully unit-testable without mocks of infrastructure.

## Folders
- `events/`: `DomainEvent`, the shape every state change writes to the outbox ([ADR-0006](../../docs/adr/0006-transactional-outbox.md)).
- `i18n/`: the supported locales and `LocalizedText` with its fallback resolver ([ADR-0019](../../docs/adr/0019-locales-and-localized-text-in-core.md)).
- `tenancy/`: organizations and venues (`Venue`, `VenueSettings` and their defaults), branded `OrgId` / `VenueId`, the venue slug rule, contact-field policies and `TimeOfDay`.
- `time/`: the `Clock` port and `FakeClock` for tests.
