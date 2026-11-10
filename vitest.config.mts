import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "tools/**/*.test.ts"],
          exclude: ["**/*.int.test.ts"],
        },
      },
      {
        // Real Postgres with RLS on the Supabase local stack (ADR-0012):
        // `pnpm db:start` first.
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["src/infra/db/testing/global-setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/infra/db/testing/**",
        "src/api/testing.ts",
      ],
    },
  },
});
