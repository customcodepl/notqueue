"use client";

import * as Sentry from "@sentry/nextjs";
import { createTranslator, type Messages } from "next-intl";
import { useEffect, useState } from "react";

import type { Locale } from "@/core/i18n/locale";
import { LOCALE_COOKIE, resolveRequestLocale } from "@/i18n/locale";

interface Texts {
  locale: Locale;
  heading: string;
  retry: string;
}

// Last-resort fallback when the root layout fails, so there is no next-intl
// provider: the locale is resolved again from the cookie and the browser.
// The catalog is loaded only now, because this component ships with every
// page and a static import would add every catalog to the bundle.
async function loadTexts(): Promise<Texts> {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  const locale = resolveRequestLocale({
    cookie,
    acceptLanguage: navigator.languages.join(","),
  });
  const { default: messages } = (await import(
    `@/i18n/messages/${locale}.json`
  )) as { default: Messages };
  const t = createTranslator({ locale, messages, namespace: "globalError" });
  return { locale, heading: t("heading"), retry: t("retry") };
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [texts, setTexts] = useState<Texts | null>(null);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    loadTexts().then(setTexts, (loadError: unknown) =>
      Sentry.captureException(loadError),
    );
  }, []);

  return (
    <html lang={texts?.locale}>
      <body>
        {texts && (
          <>
            <h1>{texts.heading}</h1>
            <button type="button" onClick={reset}>
              {texts.retry}
            </button>
          </>
        )}
      </body>
    </html>
  );
}
