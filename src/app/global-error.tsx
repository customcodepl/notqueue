"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort fallback when the root layout fails. Exempt from the i18n rule
// until F-FOUND-I18N translates it.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <h1>Something went wrong.</h1>
      </body>
    </html>
  );
}
