import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE } from "@/core/i18n/locale";

// Loaded by the next-intl plugin (next.config.ts) for every request
// (ADR-0018): no locale in the URL, so the locale comes from the request.
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
