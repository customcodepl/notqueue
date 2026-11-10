/** The document served at `/api/v1/openapi.json` and committed as a snapshot. */
export const OPENAPI_DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "notqueue API",
    version: "1",
    description:
      "Errors are RFC 9457 problems (`application/problem+json`) with a stable `code`. Instants are ISO 8601 UTC with `Z`; durations are integer seconds.",
  },
} as const;
