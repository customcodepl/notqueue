import { describe, expect, it } from "vitest";

import { memoryRepo } from "../repo";
import { checkLinks } from "./links";
import { checkPaths } from "./paths";

describe("checkLinks", () => {
  const repo = memoryRepo({
    "README.md": [
      "# Readme",
      "[ok](docs/guide.md) [anchor](docs/guide.md#setup-steps)",
      "[self](#readme) [folder](src/) [web](https://example.com) [mail](mailto:a@b.c)",
      "[code line](src/a.ts#L3)",
      "[missing](docs/nope.md) [bad anchor](docs/guide.md#nope)",
    ].join("\n"),
    "docs/guide.md": "# Guide\n## Setup steps\n[up](../README.md#readme)",
    "src/a.ts": "",
    "tools/depcruise-fixtures/README.md": "[ignored](nope.md)",
  });

  it("reports missing files and anchors only", () => {
    expect(checkLinks(repo)).toEqual([
      {
        file: "README.md",
        line: 5,
        message: "Broken link: docs/nope.md (no docs/nope.md)",
      },
      {
        file: "README.md",
        line: 5,
        message:
          "Broken anchor: docs/guide.md#nope (no heading #nope in docs/guide.md)",
      },
    ]);
  });
});

describe("checkPaths", () => {
  const repo = memoryRepo({
    "CLAUDE.md": [
      "`src/infra/db/client.ts` `src/infra/` `docs/adr/0001-x.md#context`",
      "`docs/features/<feature-id>/plan.md` `src/**/*.ts` `docs/adr/NNNN-title.md`",
      "`pnpm check` `src/gone.ts`",
    ].join("\n"),
    "docs/features/F-X/plan.md": "`src/planned-later.ts`",
    "src/infra/db/client.ts": "",
    "docs/adr/0001-x.md": "",
  });

  it("reports missing paths in living docs, not in plans", () => {
    expect(checkPaths(repo)).toEqual([
      {
        file: "CLAUDE.md",
        line: 3,
        message: "Path doesn't exist: src/gone.ts",
      },
    ]);
  });
});
