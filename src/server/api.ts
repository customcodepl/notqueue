import { createApi } from "@/api/app";
import { checkHealth } from "@/application/health/check-health";
import { getDb } from "@/infra/db/client";
import { drizzleDatabaseHealth } from "@/infra/db/database-health";
import { reportErrorToSentry } from "@/infra/observability/report-error";
import { systemClock } from "@/infra/time/system-clock";

import { buildInfo } from "./build-info";

// The composition root (ADR-0015): the only place that wires infra adapters
// into use cases and the API. Nothing here touches the database at import.
export const api = createApi({
  reportError: reportErrorToSentry,
  checkHealth: checkHealth({
    database: drizzleDatabaseHealth(getDb),
    clock: systemClock,
  }),
  // Literal process.env reads, so Next.js can inline NOTQUEUE_COMMIT_SHA.
  build: buildInfo({
    NOTQUEUE_COMMIT_SHA: process.env.NOTQUEUE_COMMIT_SHA,
    VERCEL_REGION: process.env.VERCEL_REGION,
  }),
});
