# server

The composition root ([ADR-0015](../../docs/adr/0015-composition-root.md)): creates the `infra` adapters, builds the `application` use cases with them and hands those to `createApi`. It holds wiring only, no logic.

- **May import:** every layer.
- **Imported only by:** Next.js entry points in `src/app/` (route handlers, later Server Components) and `src/instrumentation.ts`.
- `units-of-work.ts` wires `TenantUnitOfWork` and `PlatformUnitOfWork` for the use cases that need them.
- Nothing here may touch the database or read secrets at import: adapters get lazy getters such as `getDb`, so `next build` works without `DATABASE_URL`.
