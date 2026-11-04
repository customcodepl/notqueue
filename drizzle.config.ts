import { defineConfig } from "drizzle-kit";

import { readDatabaseUrl } from "./src/infra/db/env";

// drizzle-kit generates the SQL migrations; `pnpm db:migrate` applies them
// (ADR-0013). Only `generate` runs in CI, and it needs no connection.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infra/db/schema/index.ts",
  out: "./src/infra/db/migrations",
  schemaFilter: ["app"],
  dbCredentials: {
    url: readDatabaseUrl("MIGRATIONS_DATABASE_URL", process.env, {
      localFallback: true,
    }),
  },
});
