import * as Sentry from "@sentry/nextjs";

import type { ErrorReporter } from "@/application/ports/error-reporter";

/** Sends the error to Sentry, tagged with the request ID; the scrubber applies. */
export const reportErrorToSentry: ErrorReporter = (error, { requestId }) => {
  Sentry.captureException(error, { tags: { requestId } });
};
