# infra

Adapters for the outside world: database (Drizzle, tenant-scoped transactions, RLS), Supabase Realtime, notification channels, external providers. Implements the ports defined in `application`.

- **May import:** `core`, `application`.
- **Must not import:** `api`, `app`, `i18n`.
