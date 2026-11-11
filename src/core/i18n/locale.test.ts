import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, isLocale, LOCALES } from "./locale";

describe("locales", () => {
  it("supports PL and EN, with PL as the platform default", () => {
    expect(LOCALES).toEqual(["pl", "en"]);
    expect(DEFAULT_LOCALE).toBe("pl");
  });

  it("recognizes only supported locale codes", () => {
    expect(isLocale("pl")).toBe(true);
    expect(isLocale("en")).toBe(true);
    for (const value of ["de", "PL", "pl-PL", "", undefined, null, 1]) {
      expect(isLocale(value)).toBe(false);
    }
  });
});
