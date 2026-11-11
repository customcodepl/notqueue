import { defineConfig } from "@playwright/test";

import { STORAGE_STATE } from "./e2e/preview-setup";
import base from "./playwright.config";

// The same suite against a deployed preview (ADR-0020): no local server,
// @local tests skipped. Run with `pnpm e2e:preview`.
const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL) throw new Error("Set PLAYWRIGHT_BASE_URL to the deployed URL.");

export default defineConfig({
  ...base,
  grepInvert: /@local/,
  globalSetup: "./e2e/preview-setup.ts",
  webServer: undefined,
  use: {
    ...base.use,
    baseURL,
    storageState: STORAGE_STATE,
    // A trace records cookies, and CI artifacts of this public repository are
    // readable by anyone: it would leak the bypass cookie.
    trace: "off",
    screenshot: "only-on-failure",
  },
});
