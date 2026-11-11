import { LOCALES, type Locale } from "./locale";

/**
 * Venue content with a version per locale, stored as JSON
 * (`{"pl": "...", "en": "..."}`). Not every locale has to be present.
 */
export type LocalizedText = Partial<Record<Locale, string>>;

function present(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== "";
}

/**
 * Picks the version to show: the requested locale, then the venue default
 * (`fallback`), then the first non-empty value in `LOCALES` order. Empty and
 * whitespace-only values count as missing; `undefined` means no value at all.
 */
export function resolveLocalizedText(
  text: LocalizedText,
  { locale, fallback }: { locale: Locale; fallback: Locale },
): string | undefined {
  for (const candidate of [locale, fallback, ...LOCALES]) {
    const value = text[candidate];
    if (present(value)) return value;
  }
  return undefined;
}
