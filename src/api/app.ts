import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import type { CheckHealth } from "@/application/health/check-health";
import type { ErrorReporter } from "@/application/ports/error-reporter";

import type { ApiEnv } from "./context";
import { noStore } from "./middleware/no-store";
import { requestId, requestIdOf } from "./middleware/request-id";
import { ApiProblem, PROBLEM_CONTENT_TYPE, toProblemBody } from "./problems";
import { type BuildInfo, healthHandler, healthRoute } from "./routes/health";

export const API_BASE_PATH = "/api/v1";

/** Everything the API needs from outside; wired in `src/server/` (ADR-0015). */
export interface ApiDeps {
  reportError: ErrorReporter;
  checkHealth: CheckHealth;
  build: BuildInfo;
}

const VALIDATION_TARGETS: Record<string, string> = {
  json: "body",
  form: "body",
};

function problemResponse(c: Context, problem: ApiProblem): Response {
  const body = toProblemBody(problem, requestIdOf(c));
  return c.body(JSON.stringify(body), problem.status, {
    "Content-Type": PROBLEM_CONTENT_TYPE,
  });
}

/** The `/api/v1` app: routes register on it with `app.openapi(route, handler)`. */
export function createApi(deps: ApiDeps) {
  const app = new OpenAPIHono<ApiEnv>({
    // Zod failures of route schemas become `validation_failed`.
    defaultHook: (result) => {
      if (result.success) return;
      const target = VALIDATION_TARGETS[result.target] ?? result.target;
      throw new ApiProblem("validation_failed", {
        errors: result.error.issues.map((issue) => ({
          path: [target, ...issue.path.map(String)].join("."),
          code: issue.code,
        })),
      });
    },
  }).basePath(API_BASE_PATH);

  app.use("*", requestId, noStore);

  // Hono answers an unsupported method on a known path with 404 as well.
  app.notFound((c) => problemResponse(c, new ApiProblem("not_found")));

  app.onError((error, c) => {
    let problem: ApiProblem;
    if (error instanceof ApiProblem) {
      problem = error;
    } else if (error instanceof HTTPException && error.status === 400) {
      // E.g. a malformed JSON body, rejected before the schema runs.
      problem = new ApiProblem("validation_failed", { errors: [] });
    } else {
      // Generic answer: no message or stack reaches the client.
      problem = new ApiProblem("internal_error", { cause: error });
    }
    if (problem.status >= 500) {
      deps.reportError(problem.cause ?? problem, {
        requestId: requestIdOf(c),
      });
    }
    return problemResponse(c, problem);
  });

  app.openapi(healthRoute, healthHandler(deps));

  return app;
}

export type Api = ReturnType<typeof createApi>;
