import { describe, expect, it } from "vitest";

import {
  checkDocMap,
  evaluateDocMap,
  parseOptOuts,
  requiredDocs,
} from "./doc-map";
import { memoryRepo } from "./repo";

const map = {
  "src/infra/**": ["src/infra/README.md"],
  ".github/workflows/**": ["README.md", "CLAUDE.md"],
};
const existing = new Set(["src/infra/README.md", "README.md", "CLAUDE.md"]);
const exists = (file: string) => existing.has(file);

describe("requiredDocs", () => {
  it("maps changed code to docs and ignores tests, docs and the lockfile", () => {
    const required = requiredDocs(
      [
        "src/infra/db/client.ts",
        "src/infra/db/client.test.ts",
        "src/infra/db/outbox.int.test.ts",
        "src/infra/README.md",
        "pnpm-lock.yaml",
        "src/core/time/clock.ts",
      ],
      map,
    );
    expect([...required]).toEqual([
      ["src/infra/README.md", ["src/infra/db/client.ts"]],
    ]);
  });
});

describe("parseOptOuts", () => {
  it("reads doc and reason, with any dash and optional backticks", () => {
    expect(
      parseOptOuts(
        [
          "## Docs",
          "Docs-unchanged: README.md — only a comment changed",
          "Docs-unchanged: `CLAUDE.md` - no command changed",
          "Docs-unchanged: src/infra/README.md",
          "Not: Docs-unchanged: x.md — inline mention",
        ].join("\r\n"),
      ),
    ).toEqual([
      { doc: "README.md", reason: "only a comment changed", line: 2 },
      { doc: "CLAUDE.md", reason: "no command changed", line: 3 },
      { doc: "src/infra/README.md", reason: "", line: 4 },
    ]);
  });
});

describe("evaluateDocMap", () => {
  const changed = [".github/workflows/ci.yml", "src/infra/db/client.ts"];

  it("reports every required doc that wasn't touched", () => {
    expect(
      evaluateDocMap({ changed, map, optOuts: [], exists }).missing,
    ).toEqual([
      { doc: "README.md", files: [".github/workflows/ci.yml"] },
      { doc: "CLAUDE.md", files: [".github/workflows/ci.yml"] },
      { doc: "src/infra/README.md", files: ["src/infra/db/client.ts"] },
    ]);
  });

  it("accepts a changed doc or a Docs-unchanged line with a reason", () => {
    const result = evaluateDocMap({
      changed: [...changed, "README.md"],
      map,
      optOuts: parseOptOuts(
        "Docs-unchanged: CLAUDE.md — no command changed\nDocs-unchanged: src/infra/README.md — a bug fix",
      ),
      exists,
    });
    expect(result).toEqual({ missing: [], invalidOptOuts: [] });
  });

  it("rejects opt-outs without a reason or for a doc that doesn't exist", () => {
    const result = evaluateDocMap({
      changed: ["src/infra/db/client.ts"],
      map,
      optOuts: parseOptOuts(
        "Docs-unchanged: src/infra/README.md\nDocs-unchanged: src/infra/READ.md — typo",
      ),
      exists,
    });
    expect(result.missing.map((m) => m.doc)).toEqual(["src/infra/README.md"]);
    expect(result.invalidOptOuts).toEqual([
      'Docs-unchanged: src/infra/README.md needs a reason: "Docs-unchanged: src/infra/README.md — <reason>"',
      "Docs-unchanged names src/infra/READ.md, which doesn't exist",
    ]);
  });
});

describe("checkDocMap", () => {
  it("reports docs that don't exist and globs that match nothing", () => {
    const repo = memoryRepo({
      "docs/doc-map.json": JSON.stringify({
        "src/infra/**": ["src/infra/README.md", "docs/gone.md"],
        "src/old/**": ["README.md"],
      }),
      "src/infra/db/client.ts": "",
      "src/infra/README.md": "",
      "README.md": "",
    });
    expect(checkDocMap(repo).map((f) => f.message)).toEqual([
      "Doc docs/gone.md (mapped from src/infra/**) doesn't exist",
      "Glob src/old/** matches no file",
    ]);
  });
});
