import { describe, expect, it } from "vitest";

import { checkHealth } from "@/application/health/check-health";
import { FakeClock } from "@/core/time/clock";

import { createApi } from "../app";
import { Problem } from "../schemas/problem";
import { fakeApiDeps } from "../testing";

describe("GET /api/v1/health", () => {
  it("answers 200 with serverTime, version and region", async () => {
    const app = createApi(
      fakeApiDeps({
        checkHealth: checkHealth({
          database: { ping: () => Promise.resolve() },
          clock: new FakeClock("2026-10-25T01:30:00Z"),
        }),
        build: { version: "1ad8b76", region: "fra1" },
      }),
    );
    const response = await app.request("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^application\/json/);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "ok",
      serverTime: "2026-10-25T01:30:00.000Z",
      version: "1ad8b76",
      region: "fra1",
    });
  });

  it("answers 503 service_unavailable and reports the cause", async () => {
    const cause = new Error("Database did not answer within 2000 ms");
    const deps = fakeApiDeps({ checkHealth: () => Promise.reject(cause) });
    const response = await createApi(deps).request("/api/v1/health");
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    const problem = Problem.parse(await response.json());
    expect(problem.code).toBe("service_unavailable");
    expect(problem.detail).toBeUndefined();
    expect(deps.reportError).toHaveBeenCalledWith(cause, {
      requestId: response.headers.get("x-request-id"),
    });
  });
});
