import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkCatalogs } from "./check";

const fixture = (locale: string) =>
  JSON.parse(
    readFileSync(
      join(import.meta.dirname, "fixtures", `${locale}.json`),
      "utf8",
    ),
  ) as unknown;

describe("checkCatalogs", () => {
  it("reports every kind of finding in the fixtures, and nothing else", () => {
    const findings = checkCatalogs(
      { en: fixture("en"), pl: fixture("pl") },
      "en",
    )
      .map(({ locale, key, message }) => `${locale} ${key}: ${message}`)
      .map((line) => line.replace(/invalid ICU \(.*\)/, "invalid ICU"))
      .sort();

    expect(findings).toEqual([
      "en invalid: invalid ICU",
      "en onlyInPl: missing",
      "pl empty: empty",
      "pl nested.notAString: not a string",
      "pl onlyInEn: missing",
      "pl pluralGap: plural `count` lacks few, many",
      "pl renamed: arguments ticket differ from en (number)",
    ]);
  });

  it("passes the real catalogs", () => {
    const real = (locale: string) =>
      JSON.parse(
        readFileSync(
          join(
            import.meta.dirname,
            "../../src/i18n/messages",
            `${locale}.json`,
          ),
          "utf8",
        ),
      ) as unknown;
    expect(checkCatalogs({ en: real("en"), pl: real("pl") }, "en")).toEqual([]);
  });
});
