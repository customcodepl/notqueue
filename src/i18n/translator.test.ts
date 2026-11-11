import { describe, expect, it } from "vitest";

import { getTranslator } from "./translator";

describe("getTranslator", () => {
  it("translates a namespace in the given locale", () => {
    expect(getTranslator("pl", "errors")("not_found")).toBe(
      "Nie znaleźliśmy tego, czego szukasz.",
    );
    expect(getTranslator("en", "errors")("not_found")).toBe(
      "We couldn't find what you were looking for.",
    );
  });
});
