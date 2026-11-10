import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Inlined at build, so /api/v1/health reports the commit it was built from
  // also for prebuilt deploys: the deploy workflow sets NOTQUEUE_COMMIT_SHA,
  // Vercel's Git builds (previews) provide VERCEL_GIT_COMMIT_SHA.
  env: {
    NOTQUEUE_COMMIT_SHA:
      process.env.NOTQUEUE_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      "",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSentryConfig(nextConfig, {
  // EU data residency (ADR-0003). The auth token comes from SENTRY_AUTH_TOKEN;
  // without it (local builds, CI) source maps are not uploaded.
  sentryUrl: "https://de.sentry.io/",
  org: "customcode-tv",
  project: "notqueue",
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // Errors only: drop tracing, Replay and debug code from the client bundle.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
