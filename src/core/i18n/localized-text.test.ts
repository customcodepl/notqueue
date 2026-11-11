import { describe, expect, it } from "vitest";

import { resolveLocalizedText } from "./localized-text";

describe("resolveLocalizedText", () => {
  it("returns the requested locale when present", () => {
    expect(
      resolveLocalizedText(
        { pl: "Strzyżenie", en: "Haircut" },
        { locale: "en", fallback: "pl" },
      ),
    ).toBe("Haircut");
  });

  it("falls back to the venue default", () => {
    expect(
      resolveLocalizedText(
        { pl: "Strzyżenie" },
        { locale: "en", fallback: "pl" },
      ),
    ).toBe("Strzyżenie");
  });

  it("falls back to the first non-empty value in locale order", () => {
    expect(
      resolveLocalizedText({ en: "Haircut" }, { locale: "pl", fallback: "pl" }),
    ).toBe("Haircut");
  });

  it("treats empty and whitespace-only values as missing", () => {
    expect(
      resolveLocalizedText(
        { pl: "  ", en: "" },
        { locale: "pl", fallback: "en" },
      ),
    ).toBeUndefined();
    expect(
      resolveLocalizedText(
        { pl: "", en: "Haircut" },
        { locale: "pl", fallback: "pl" },
      ),
    ).toBe("Haircut");
  });

  it("ignores keys of unsupported locales", () => {
    const stored = JSON.parse('{"de": "Haarschnitt"}') as Record<
      string,
      string
    >;
    expect(
      resolveLocalizedText(stored, { locale: "pl", fallback: "en" }),
    ).toBeUndefined();
  });

  it("returns the value unchanged", () => {
    expect(
      resolveLocalizedText(
        { pl: " Strzyżenie " },
        { locale: "pl", fallback: "pl" },
      ),
    ).toBe(" Strzyżenie ");
  });
});
