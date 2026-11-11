import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, resolveRequestLocale } from "./locale";

// Loaded by the next-intl plugin (next.config.ts) for every request
// (ADR-0018): no locale in the URL, so the locale comes from the request.
export default getRequestConfig(async () => {
  const locale = resolveRequestLocale({
    cookie: (await cookies()).get(LOCALE_COOKIE)?.value,
    acceptLanguage: (await headers()).get("accept-language"),
  });

  return {
    locale,
    // Formatting goes through format.ts with the venue's timezone; UTC here
    // makes a path that skips it visibly wrong instead of plausibly local.
    timeZone: "UTC",
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
