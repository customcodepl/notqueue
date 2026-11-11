/**
 * The supported locales (ADR-0019). Adding one means adding it here and its
 * catalog in src/i18n/messages; `pnpm i18n:check` lists the missing messages.
 * The order is the last-resort fallback order of `resolveLocalizedText`.
 */
export const LOCALES = ["pl", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** The platform default, used when neither the request nor a venue decides. */
export const DEFAULT_LOCALE: Locale = "pl";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
