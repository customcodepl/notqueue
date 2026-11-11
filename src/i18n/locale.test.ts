import { describe, expect, it } from "vitest";

import { localesFromAcceptLanguage, resolveRequestLocale } from "./locale";

describe("localesFromAcceptLanguage", () => {
  it("orders supported locales by quality, then by position", () => {
    expect(localesFromAcceptLanguage("de-DE,en-GB;q=0.8,pl;q=0.9")).toEqual([
      "pl",
      "en",
    ]);
    expect(localesFromAcceptLanguage("en, pl")).toEqual(["en", "pl"]);
  });

  it("matches region tags and ignores case", () => {
    expect(localesFromAcceptLanguage("PL-pl")).toEqual(["pl"]);
    expect(localesFromAcceptLanguage("en-US,en;q=0.9")).toEqual(["en"]);
  });

  it("drops q=0, unsupported and malformed entries", () => {
    expect(localesFromAcceptLanguage("pl;q=0, en;q=abc, de, *")).toEqual([]);
    expect(localesFromAcceptLanguage("")).toEqual([]);
    expect(localesFromAcceptLanguage(null)).toEqual([]);
  });
});

describe("resolveRequestLocale", () => {
  it("prefers the cookie over the browser languages", () => {
    expect(
      resolveRequestLocale({ cookie: "en", acceptLanguage: "pl-PL" }),
    ).toBe("en");
  });

  it("ignores an invalid cookie value", () => {
    expect(
      resolveRequestLocale({ cookie: "de", acceptLanguage: "en-GB" }),
    ).toBe("en");
  });

  it("falls back to the platform default", () => {
    expect(
      resolveRequestLocale({ cookie: undefined, acceptLanguage: "de-DE" }),
    ).toBe("pl");
    expect(
      resolveRequestLocale({ cookie: undefined, acceptLanguage: null }),
    ).toBe("pl");
  });
});
