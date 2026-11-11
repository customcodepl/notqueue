import { defineConfig, devices } from "@playwright/test";

// Fixed port, separate from `next dev` (3000), so both can run side by side.
const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  // @preview tests need a deployment (playwright.preview.config.ts).
  grepInvert: /@preview/,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // WebKit approximates iOS Safari; real-device checks stay in the definition of done.
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
    { name: "tablet-webkit", use: { ...devices["iPad (gen 11)"] } },
  ],
  webServer: {
    // CI builds in a separate step, so a build failure is reported on its own.
    command: isCI
      ? `pnpm start --port ${PORT}`
      : `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    // No database in E2E: a closed local port makes /api/v1/health answer
    // 503 deterministically. The 200 path is covered by unit and integration
    // tests and by the deploy smoke check.
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:1/postgres",
    },
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
