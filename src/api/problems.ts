import type { ContentfulStatusCode } from "hono/utils/http-status";

// The registry of problem codes (ADR-0014). Clients translate by `code`;
// `title` is English and meant for developers only.
const PROBLEMS = {
  validation_failed: { status: 400, title: "Request validation failed" },
  not_found: { status: 404, title: "Resource not found" },
  internal_error: { status: 500, title: "Internal server error" },
  service_unavailable: { status: 503, title: "Service unavailable" },
} as const satisfies Record<
  string,
  { status: ContentfulStatusCode; title: string }
>;

export type ProblemCode = keyof typeof PROBLEMS;

export const PROBLEM_CODES = Object.keys(PROBLEMS) as [
  ProblemCode,
  ...ProblemCode[],
];

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

/** One failed field of a validation error, e.g. `query.date`. */
export interface ProblemFieldError {
  path: string;
  code: string;
}

/** Throw from a route or use case adapter to answer with a problem. */
export class ApiProblem extends Error {
  readonly code: ProblemCode;
  readonly status: ContentfulStatusCode;
  /** Sent to the client: must never contain PII. */
  readonly detail: string | undefined;
  readonly errors: ProblemFieldError[] | undefined;

  constructor(
    code: ProblemCode,
    options: {
      detail?: string;
      errors?: ProblemFieldError[];
      cause?: unknown;
    } = {},
  ) {
    super(PROBLEMS[code].title, { cause: options.cause });
    this.name = "ApiProblem";
    this.code = code;
    this.status = PROBLEMS[code].status;
    this.detail = options.detail;
    this.errors = options.errors;
  }
}

/** The RFC 9457 body; `instance` is the request ID. */
export function toProblemBody(problem: ApiProblem, requestId: string) {
  return {
    type: `urn:notqueue:problem:${problem.code}`,
    title: PROBLEMS[problem.code].title,
    status: problem.status,
    code: problem.code,
    ...(problem.detail === undefined ? {} : { detail: problem.detail }),
    instance: `urn:uuid:${requestId}`,
    ...(problem.errors === undefined ? {} : { errors: problem.errors }),
  };
}
