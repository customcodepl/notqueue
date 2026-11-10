import { writeFileSync } from "node:fs";

import { createApi } from "./app";
import { OPENAPI_DOCUMENT } from "./routes/openapi";

export const SPEC_PATH = "docs/api/openapi.json";

/** The OpenAPI document as committed; the spec doesn't depend on the deps. */
export function generateSpec(): string {
  const api = createApi({
    reportError: () => {},
    checkHealth: () => Promise.reject(new Error("Not wired for the spec")),
    build: { version: "spec", region: "spec" },
  });
  const document = api.getOpenAPI31Document(OPENAPI_DOCUMENT);
  return `${JSON.stringify(document, null, 2)}\n`;
}

// `pnpm api:spec`: rewrites the snapshot after a contract change.
if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(SPEC_PATH, generateSpec());
  console.log(`Wrote ${SPEC_PATH}.`);
}
