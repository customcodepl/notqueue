import { createRoute, z } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import { createApi } from "./app";
import { ApiProblem } from "./problems";
import { Problem } from "./schemas/problem";
import { LocalDate } from "./schemas/time";
import { fakeApiDeps } from "./testing";

const REQUEST_ID = "3f0c9a2e-6a53-4c5e-9d43-5b1f0a7e2c11";

function setup() {
  const deps = fakeApiDeps();
  const reportError = deps.reportError;
  const app = createApi(deps);

  app.openapi(
    createRoute({
      method: "get",
      path: "/echo",
      request: { query: z.object({ date: LocalDate }) },
      responses: {
        200: {
          description: "Echo",
          content: {
            "application/json": { schema: z.object({ date: LocalDate }) },
          },
        },
      },
    }),
    (c) => c.json({ date: c.req.valid("query").date }, 200),
  );
  app.openapi(
    createRoute({
      method: "post",
      path: "/echo",
      request: {
        body: {
          content: {
            "application/json": { schema: z.object({ name: z.string() }) },
          },
        },
      },
      responses: { 204: { description: "Accepted" } },
    }),
    (c) => c.body(null, 204),
  );
  app.get("/boom", () => {
    throw new Error("secret stack detail");
  });
  app.get("/down", () => {
    throw new ApiProblem("service_unavailable", {
      cause: new Error("database timeout"),
    });
  });

  return { app, reportError };
}

async function problemOf(response: Response) {
  expect(response.headers.get("content-type")).toBe("application/problem+json");
  return Problem.parse(await response.json());
}

describe("createApi", () => {
  it("serves routes under /api/v1", async () => {
    const { app } = setup();
    const response = await app.request("/api/v1/echo?date=2026-10-25");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ date: "2026-10-25" });
  });

  describe("problem+json", () => {
    it("turns schema failures into validation_failed", async () => {
      const { app, reportError } = setup();
      const response = await app.request("/api/v1/echo?date=2026-02-30", {
        headers: { "x-request-id": REQUEST_ID },
      });
      expect(response.status).toBe(400);
      expect(await problemOf(response)).toEqual({
        type: "urn:notqueue:problem:validation_failed",
        title: "Request validation failed",
        status: 400,
        code: "validation_failed",
        instance: `urn:uuid:${REQUEST_ID}`,
        errors: [{ path: "query.date", code: "invalid_format" }],
      });
      expect(reportError).not.toHaveBeenCalled();
    });

    it("reports body fields under body and rejects malformed JSON", async () => {
      const { app } = setup();
      const invalid = await app.request("/api/v1/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: 42 }),
      });
      expect((await problemOf(invalid)).errors).toEqual([
        { path: "body.name", code: "invalid_type" },
      ]);

      const malformed = await app.request("/api/v1/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      });
      expect(malformed.status).toBe(400);
      expect((await problemOf(malformed)).code).toBe("validation_failed");
    });

    it("answers unknown paths and unsupported methods with not_found", async () => {
      const { app } = setup();
      for (const response of [
        await app.request("/api/v1/nope"),
        await app.request("/api/v1/echo", { method: "DELETE" }),
      ]) {
        expect(response.status).toBe(404);
        const problem = await problemOf(response);
        expect(problem.code).toBe("not_found");
        expect(problem.instance).toBe(
          `urn:uuid:${response.headers.get("x-request-id")}`,
        );
      }
    });

    it("hides thrown errors and reports them with the request ID", async () => {
      const { app, reportError } = setup();
      const response = await app.request("/api/v1/boom", {
        headers: { "x-request-id": REQUEST_ID },
      });
      expect(response.status).toBe(500);
      const text = await response.clone().text();
      expect(text).not.toContain("secret");
      expect((await problemOf(response)).code).toBe("internal_error");
      expect(reportError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "secret stack detail" }),
        { requestId: REQUEST_ID },
      );
    });

    it("reports the cause of a 5xx problem, not the problem", async () => {
      const { app, reportError } = setup();
      const response = await app.request("/api/v1/down");
      expect(response.status).toBe(503);
      expect((await problemOf(response)).code).toBe("service_unavailable");
      expect(reportError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "database timeout" }),
        { requestId: response.headers.get("x-request-id") },
      );
    });
  });

  describe("request ID", () => {
    it("generates one when missing", async () => {
      const { app } = setup();
      const response = await app.request("/api/v1/echo?date=2026-10-25");
      expect(response.headers.get("x-request-id")).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it("echoes a valid UUID, lowercased", async () => {
      const { app } = setup();
      const response = await app.request("/api/v1/echo?date=2026-10-25", {
        headers: { "x-request-id": REQUEST_ID.toUpperCase() },
      });
      expect(response.headers.get("x-request-id")).toBe(REQUEST_ID);
    });

    it("replaces anything that isn't a UUID", async () => {
      const { app } = setup();
      const response = await app.request("/api/v1/nope", {
        headers: { "x-request-id": "jan.kowalski@example.com" },
      });
      const id = response.headers.get("x-request-id");
      expect(id).not.toContain("kowalski");
      expect((await problemOf(response)).instance).toBe(`urn:uuid:${id}`);
    });
  });

  it("sets Cache-Control: no-store on success and error responses", async () => {
    const { app } = setup();
    for (const path of [
      "/api/v1/echo?date=2026-10-25",
      "/api/v1/echo?date=nope",
      "/api/v1/nope",
      "/api/v1/boom",
    ]) {
      const response = await app.request(path);
      expect(response.headers.get("cache-control"), path).toBe("no-store");
    }
  });
});
