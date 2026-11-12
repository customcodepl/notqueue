import { describe, expect, it } from "vitest";

import {
  checkDocMap,
  docReview,
  formatDocReview,
  requiredDocs,
} from "./doc-map";
import { prHookDecision } from "./pr-hook";
import { memoryRepo } from "./repo";

const map = {
  "src/infra/**": ["src/infra/README.md"],
  ".github/workflows/**": ["README.md", "CLAUDE.md"],
};

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

describe("docReview", () => {
  it("lists every file per doc and whether the doc changed", () => {
    const items = docReview(
      [
        "src/infra/db/client.ts",
        "src/infra/db/outbox.ts",
        "src/infra/README.md",
        ".github/workflows/ci.yml",
      ],
      map,
    );
    expect(formatDocReview(items)).toEqual([
      "src/infra/README.md (changed in this branch): src/infra/db/client.ts, src/infra/db/outbox.ts",
      "README.md (not changed in this branch): .github/workflows/ci.yml",
      "CLAUDE.md (not changed in this branch): .github/workflows/ci.yml",
    ]);
  });
});

describe("prHookDecision", () => {
  const review = docReview(["src/infra/db/client.ts"], map);
  const base = { head: "abc", stamp: undefined, review };

  it("ignores commands other than gh pr create", () => {
    for (const command of [
      "git commit -m 'gh pr'",
      "python3 - <<'EOF'\ntext = 'run `gh pr create` later'\nEOF",
      "echo gh pr create",
    ]) {
      expect(prHookDecision({ ...base, command })).toEqual({
        action: "ignore",
      });
    }
  });

  it("denies the first attempt per HEAD with the full list", () => {
    const decision = prHookDecision({
      ...base,
      command: "git push && gh pr create --title x",
    });
    expect(decision).toMatchObject({ action: "deny", stamp: "abc" });
    expect(decision.action === "deny" && decision.reason).toContain(
      "- src/infra/README.md (not changed in this branch): src/infra/db/client.ts",
    );
  });

  it("allows the retry for the same HEAD and asks again after a new commit", () => {
    expect(
      prHookDecision({ ...base, stamp: "abc", command: "gh pr create" }),
    ).toEqual({ action: "allow" });
    expect(
      prHookDecision({ ...base, stamp: "old", command: "gh pr create" }),
    ).toMatchObject({ action: "deny", stamp: "abc" });
  });

  it("denies gh pr create chained after a commit, without a stamp", () => {
    for (const command of [
      "git commit -qam 'docs: x' && git push && gh pr create --title x",
      "git -C repo merge main; gh pr create",
      "git revert --no-commit HEAD && git commit -m x\ngh pr create",
    ]) {
      const decision = prHookDecision({ ...base, review: [], command });
      expect(decision).toMatchObject({ action: "deny" });
      expect(decision).not.toHaveProperty("stamp");
      expect(decision.action === "deny" && decision.reason).toContain(
        "run gh pr create as a command of its own",
      );
    }
  });

  it("allows right away when no mapped code changed", () => {
    expect(
      prHookDecision({ ...base, review: [], command: "gh pr create" }),
    ).toEqual({ action: "allow", stamp: "abc" });
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
