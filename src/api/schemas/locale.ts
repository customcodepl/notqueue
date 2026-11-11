import { z } from "@hono/zod-openapi";

import { LOCALES } from "@/core/i18n/locale";

// Shared API formats for languages (ADR-0019).

/** A supported locale code. */
export const Locale = z.enum(LOCALES).openapi("Locale", {
  description: "A supported locale code.",
  example: "pl",
});

/**
 * Venue content per locale, e.g. a venue or service name. Not every locale
 * must be present, but at least one non-empty value is.
 */
export const LocalizedText = z
  .partialRecord(Locale, z.string())
  .refine((text) => Object.values(text).some((value) => value.trim() !== ""), {
    message: "Needs at least one non-empty value",
  })
  .openapi("LocalizedText", {
    description:
      "Text per locale code. Missing locales fall back to the venue's default locale.",
    example: { pl: "Strzyżenie", en: "Haircut" },
  });
