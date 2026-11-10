# app

Next.js App Router: pages, layouts and UI. Client mutations go through `/api/v1`; Server Components may call `application` with the same auth context. Clients never query Supabase directly.

- **May import:** `application`, `core`, `i18n`.
- **Must not import:** `infra`. Entry points that need adapters or use cases get them from the composition root in `src/server/` ([ADR-0015](../../docs/adr/0015-composition-root.md)); `api/v1/[[...route]]/route.ts` hands every request to the Hono app.
