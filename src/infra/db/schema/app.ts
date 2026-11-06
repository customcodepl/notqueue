import { pgSchema } from "drizzle-orm/pg-core";

/**
 * All application tables live in `app`, which is not exposed through the
 * Supabase Data API and has no grants to `anon`, `authenticated` or `public`
 * (ADR-0004, ADR-0005).
 */
export const app = pgSchema("app");
