import { z } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import { Locale, LocalizedText } from "./locale";

function accepts(schema: z.ZodType, values: unknown[]) {
  for (const value of values) {
    expect(schema.safeParse(value).success, JSON.stringify(value)).toBe(true);
  }
}

function rejects(schema: z.ZodType, values: unknown[]) {
  for (const value of values) {
    expect(schema.safeParse(value).success, JSON.stringify(value)).toBe(false);
  }
}

describe("locale schemas", () => {
  it("Locale: supported codes only", () => {
    accepts(Locale, ["pl", "en"]);
    rejects(Locale, ["de", "PL", "pl-PL", "", null]);
  });

  it("LocalizedText: supported keys, at least one non-empty value", () => {
    accepts(LocalizedText, [
      { pl: "Strzyżenie", en: "Haircut" },
      { pl: "Strzyżenie" },
      { pl: "", en: "Haircut" },
    ]);
    rejects(LocalizedText, [
      {},
      { pl: "", en: "  " },
      { de: "Haarschnitt" },
      { pl: "Strzyżenie", de: "Haarschnitt" },
      { pl: 1 },
      "Strzyżenie",
    ]);
  });
});
