import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { createApi } from "./app";
import { generateSpec, SPEC_PATH } from "./spec";
import { fakeApiDeps } from "./testing";

describe("OpenAPI spec", () => {
  it("matches the committed snapshot (run `pnpm api:spec` after a contract change)", () => {
    expect(generateSpec()).toBe(readFileSync(SPEC_PATH, "utf8"));
  });

  it("is served at /api/v1/openapi.json", async () => {
    const response = await createApi(fakeApiDeps()).request(
      "/api/v1/openapi.json",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await response.json()).toEqual(
      JSON.parse(readFileSync(SPEC_PATH, "utf8")),
    );
  });
});
