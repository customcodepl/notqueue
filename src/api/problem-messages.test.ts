import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n/locale";
import en from "@/i18n/messages/en.json";
import pl from "@/i18n/messages/pl.json";

import { PROBLEM_CODES } from "./problems";

// Clients show a translated message chosen by `code` (ADR-0014), so every
// registered code needs one in every locale.
const CATALOGS: Record<(typeof LOCALES)[number], { errors: object }> = {
  pl,
  en,
};

describe("problem code messages", () => {
  it.each(LOCALES)("every problem code has a message in %s", (locale) => {
    const errors = CATALOGS[locale].errors as Record<string, unknown>;
    for (const code of PROBLEM_CODES) {
      expect(typeof errors[code], `errors.${code}`).toBe("string");
    }
  });
});
