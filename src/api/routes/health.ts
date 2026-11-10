import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";

import type { CheckHealth } from "@/application/health/check-health";

import type { ApiEnv } from "../context";
import { ApiProblem, PROBLEM_CONTENT_TYPE } from "../problems";
import { Problem } from "../schemas/problem";
import { toInstant, withServerTime } from "../schemas/time";

/** The deployment that answered; from Vercel's system env (`src/server/`). */
export interface BuildInfo {
  version: string;
  region: string;
}

export const Health = withServerTime(
  z.object({
    status: z.literal("ok"),
    version: z.string().openapi({
      description: "Short commit SHA of the deployment, `dev` locally.",
      example: "1ad8b76",
    }),
    region: z.string().openapi({
      description: "Vercel region that served the request, `local` locally.",
      example: "fra1",
    }),
  }),
).openapi("Health");

export const healthRoute = createRoute({
  method: "get",
  path: "/health",
  summary: "Health check",
  description:
    "Public. Healthy when the function runs and the database answers within 2 seconds.",
  responses: {
    200: {
      description: "Healthy",
      content: { "application/json": { schema: Health } },
    },
    503: {
      description: "The database didn't answer (`service_unavailable`)",
      content: { [PROBLEM_CONTENT_TYPE]: { schema: Problem } },
    },
  },
});

export function healthHandler(deps: {
  checkHealth: CheckHealth;
  build: BuildInfo;
}): RouteHandler<typeof healthRoute, ApiEnv> {
  return async (c) => {
    let report;
    try {
      report = await deps.checkHealth();
    } catch (cause) {
      // The cause goes to Sentry, not into the response.
      throw new ApiProblem("service_unavailable", { cause });
    }
    return c.json(
      {
        status: "ok" as const,
        serverTime: toInstant(report.serverTime),
        version: deps.build.version,
        region: deps.build.region,
      },
      200,
    );
  };
}
