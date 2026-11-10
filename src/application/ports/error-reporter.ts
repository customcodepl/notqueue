/**
 * Reports an unexpected error to monitoring (Sentry in production). The
 * context carries correlation data only, never PII.
 */
export type ErrorReporter = (
  error: unknown,
  context: { requestId: string },
) => void;
