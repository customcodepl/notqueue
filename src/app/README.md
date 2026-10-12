# app

Next.js App Router: pages, layouts and UI. Client mutations go through `/api/v1`; Server Components may call `application` with the same auth context. Clients never query Supabase directly.

- **May import:** `application`, `core`, `i18n`.
- **Must not import:** `infra`. How the composition root wires `infra` in is decided in F-FOUND-API.
