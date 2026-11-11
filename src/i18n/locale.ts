import { DEFAULT_LOCALE, isLocale, type Locale } from "@/core/i18n/locale";

/** Holds the visitor's explicit language choice, `pl` or `en` only. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Supported locales from an `Accept-Language` header, most preferred first.
 * Region tags match their language (`pl-PL` → `pl`); `q=0` excludes a tag.
 */
export function localesFromAcceptLanguage(header: string | null): Locale[] {
  if (!header) return [];

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const quality = q === undefined ? 1 : Number(q.slice(2));
      const language = tag.trim().split("-")[0]?.toLowerCase();
      return { language, quality, index };
    })
    .filter(({ quality }) => Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  const locales: Locale[] = [];
  for (const { language } of ranked) {
    if (isLocale(language) && !locales.includes(language)) {
      locales.push(language);
    }
  }
  return locales;
}

/**
 * The locale for a request: the explicit choice (cookie), then the browser
 * languages, then the platform default (ADR-0018). Later features insert the
 * venue's enabled and default locales.
 */
export function resolveRequestLocale({
  cookie,
  acceptLanguage,
}: {
  cookie: string | undefined;
  acceptLanguage: string | null;
}): Locale {
  if (isLocale(cookie)) return cookie;
  return localesFromAcceptLanguage(acceptLanguage)[0] ?? DEFAULT_LOCALE;
}
