import { z } from "@hono/zod-openapi";

import { PROBLEM_CODES } from "../problems";

/** The shared error response of every endpoint (RFC 9457, ADR-0014). */
export const Problem = z
  .object({
    type: z.string().openapi({ example: "urn:notqueue:problem:not_found" }),
    title: z.string().openapi({
      description: "English, for developers. Never shown to end users.",
    }),
    status: z.number().int(),
    code: z.enum(PROBLEM_CODES).openapi({
      description: "Stable machine code. Clients translate messages by it.",
    }),
    detail: z.string().optional(),
    instance: z.string().openapi({
      description: "The request ID, also sent as `x-request-id`.",
      example: "urn:uuid:3f0c9a2e-6a53-4c5e-9d43-5b1f0a7e2c11",
    }),
    errors: z
      .array(
        z.object({
          path: z.string().openapi({ example: "query.date" }),
          code: z.string().openapi({ example: "invalid_format" }),
        }),
      )
      .optional()
      .openapi({ description: "Failed fields of a validation error." }),
  })
  .openapi("Problem");
