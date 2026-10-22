import type { BrowserOptions } from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "./scrub";

/**
 * Options shared by the server, edge and browser Sentry SDKs.
 * Errors only: no tracing and no Session Replay (PII and the customer JS
 * budget). Without a DSN (local dev, tests) nothing is sent. `environment`
 * and `release` come from the Vercel system variables via the SDK defaults.
 */
export function sentryOptions(dsn: string | undefined) {
  return {
    dsn,
    enabled: Boolean(dsn),
    // The SDK collects all of these by default; nothing that may hold PII is
    // collected, and scrubEvent removes anything that slips through.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  } satisfies BrowserOptions;
}
