import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Proves the lint rule that keeps date formatting in src/i18n/format.ts.
// Linted as text under existing paths, so the type-aware config applies.
const eslint = new ESLint();

async function restrictedFindings(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? [])
    .map((message) => message.ruleId)
    .filter((rule) => rule?.startsWith("no-restricted-"));
}

const VIOLATIONS = `
import { useFormatter } from "next-intl";
import { getFormatter } from "next-intl/server";
export const a = new Intl.DateTimeFormat("pl").format(new Date(0));
export const b = new Date(0).toLocaleTimeString("pl");
export { useFormatter, getFormatter };
`;

describe("date formatting lint rule", () => {
  it("rejects formatter APIs outside src/i18n", async () => {
    expect(await restrictedFindings(VIOLATIONS, "src/app/page.tsx")).toEqual([
      "no-restricted-imports",
      "no-restricted-imports",
      "no-restricted-syntax",
      "no-restricted-syntax",
    ]);
  }, 30_000);

  it("allows them inside src/i18n", async () => {
    expect(await restrictedFindings(VIOLATIONS, "src/i18n/format.ts")).toEqual(
      [],
    );
  }, 30_000);
});
