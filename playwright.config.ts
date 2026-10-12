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
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
