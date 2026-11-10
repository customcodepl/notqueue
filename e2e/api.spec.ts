import { expect, test } from "@playwright/test";

// The production build serves /api/v1 through the Next.js route handler.
// E2E runs without a database (see playwright.config.ts), so /health is 503.

test("serves the OpenAPI document", async ({ request }) => {
  const response = await request.get("/api/v1/openapi.json");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json/);
  const document = (await response.json()) as {
    openapi: string;
    paths: Record<string, unknown>;
  };
  expect(document.openapi).toBe("3.1.0");
  expect(document.paths).toHaveProperty("/api/v1/health");
});

test("health answers 503 problem+json without a database", async ({
  request,
}) => {
  const response = await request.get("/api/v1/health");

  expect(response.status()).toBe(503);
  const headers = response.headers();
  expect(headers["content-type"]).toBe("application/problem+json");
  expect(headers["cache-control"]).toBe("no-store");
  expect(await response.json()).toMatchObject({
    code: "service_unavailable",
    status: 503,
    instance: `urn:uuid:${headers["x-request-id"]}`,
  });
});

test("unknown API paths answer 404 problem+json", async ({ request }) => {
  const response = await request.get("/api/v1/nope");

  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toBe("application/problem+json");
  expect(await response.json()).toMatchObject({ code: "not_found" });
});
