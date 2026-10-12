import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const fixtureDir = import.meta.dirname;

type CruiseResult = {
  summary: {
    violations: { rule: { name: string }; from: string; to: string }[];
  };
};

function cruiseFixtures(): CruiseResult {
  const result = spawnSync(
    path.join(repoRoot, "node_modules/.bin/depcruise"),
    [
      "src",
      "--config",
      path.join(repoRoot, ".dependency-cruiser.cjs"),
      "--output-type",
      "json",
    ],
    { cwd: fixtureDir, encoding: "utf8" },
  );
  return JSON.parse(result.stdout) as CruiseResult;
}

describe("layer boundary rules", () => {
  it("report exactly one violation per rule in the fixtures", () => {
    const violations = cruiseFixtures()
      .summary.violations.map((v) => `${v.rule.name}: ${v.from}`)
      .sort();

    expect(violations).toEqual([
      "application-imports-outer-layer: src/application/imports-infra.ts",
      "core-imports-framework-or-io: src/core/imports-react.ts",
      "core-imports-other-layer: src/core/imports-infra.ts",
      "i18n-imports-non-core: src/i18n/imports-application.ts",
      "infra-imports-outer-layer: src/infra/imports-app.ts",
      "no-circular: src/core/cycle-a.ts",
      "presentation-imports-infra: src/api/imports-infra.ts",
    ]);
  });
});
