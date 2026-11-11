import { describe, expect, it } from "vitest";

import { memoryRepo } from "../repo";
import { checkAdrIndex } from "./adr-index";
import { checkCommands } from "./commands";
import { checkProgress } from "./progress";

const messages = (findings: { message: string }[]) =>
  findings.map((f) => f.message);

describe("checkCommands", () => {
  const claude = (commands: string) =>
    `# Project\n## Commands\nRun \`pnpm install\` first.\n\`\`\`\n${commands}\n\`\`\`\n## Next\npnpm elsewhere\n`;
  const pkg = JSON.stringify({
    scripts: { start: "", prepare: "", lint: "", test: "", "test:unit": "" },
  });

  it("passes when both sides match, in comments too", () => {
    const repo = memoryRepo({
      "package.json": pkg,
      "CLAUDE.md": claude("lint: pnpm lint\ntest: pnpm test  # test:unit only"),
    });
    expect(checkCommands(repo)).toEqual([]);
  });

  it("reports unknown and unlisted scripts", () => {
    const repo = memoryRepo({
      "package.json": pkg,
      "CLAUDE.md": claude("lint: pnpm lint\nbuild: pnpm build"),
    });
    expect(messages(checkCommands(repo))).toEqual([
      "Unknown script: pnpm build (not in package.json)",
      'Script "test" from package.json isn\'t listed in Commands',
      'Script "test:unit" from package.json isn\'t listed in Commands',
    ]);
  });
});

describe("checkAdrIndex", () => {
  const adr = (number: string, title: string, status: string) =>
    `# ADR-${number}: ${title}\n\n- **Status:** ${status}\n- **Date:** 2026-11-11\n`;

  it("passes when rows match files, with superseded links normalized", () => {
    const repo = memoryRepo({
      "docs/adr/README.md": [
        "| ADR | Title | Status | Date |",
        "|---|---|---|---|",
        "| [0001](0001-first.md) | First `thing` | superseded by 0002 | 2026-11-11 |",
        "| [0002](0002-second.md) | Second | accepted | 2026-11-11 |",
      ].join("\n"),
      "docs/adr/0001-first.md": adr(
        "0001",
        "First `thing`",
        "superseded by [ADR-0002](0002-second.md)",
      ),
      "docs/adr/0002-second.md": adr("0002", "Second", "accepted"),
      "docs/adr/TEMPLATE.md": "# ADR-NNNN: template",
    });
    expect(checkAdrIndex(repo)).toEqual([]);
  });

  it("reports missing rows, stale titles and statuses, and orphan rows", () => {
    const repo = memoryRepo({
      "docs/adr/README.md": [
        "| [0001](0001-first.md) | Old title | proposed | 2026-11-11 |",
        "| [0009](0009-gone.md) | Gone | accepted | 2026-11-11 |",
      ].join("\n"),
      "docs/adr/0001-first.md": adr("0001", "First", "accepted"),
      "docs/adr/0002-second.md": adr("0002", "Second", "accepted"),
    });
    expect(messages(checkAdrIndex(repo))).toEqual([
      'ADR-0001 title "Old title" differs from the file: "First"',
      'ADR-0001 status "proposed" differs from the file: "accepted"',
      "ADR-0002 (docs/adr/0002-second.md) is missing from the index",
      "ADR-0009 is in the index but has no file",
    ]);
  });
});

describe("checkProgress", () => {
  const features = (progress: string, total: number) =>
    [
      "## Progress",
      "| Stage | Features done | Status |",
      "|---|---|---|",
      progress,
      "## Features",
      "### Stage 0: Foundations",
      "| ID | Name | Status | Depends on | Description |",
      "|---|---|---|---|---|",
      "| F-A | A | done | – | a |",
      "| F-B | B | in progress | F-A | b |",
      "| F-C | C | dropped | – | c |",
      "### Stage 1: Next",
      "| F-D | D | planned | – | d |",
      `**Total: ${total} features.**`,
      "## Dependency graph",
      "| F-E | not a feature row | done | – | e |",
    ].join("\n");

  it("passes when counts match; dropped features leave the count", () => {
    const repo = memoryRepo({
      "docs/FEATURES.md": features(
        "| 0: Foundations | 1 / 2 | in progress |\n| 1: Next | 0 / 1 | not started |\n| **v1.0** | **1 / 3** | in progress |",
        3,
      ),
    });
    expect(checkProgress(repo)).toEqual([]);
  });

  it("reports stale stage, release and total counts", () => {
    const repo = memoryRepo({
      "docs/FEATURES.md": features(
        "| 0: Foundations | 0 / 2 | in progress |\n| 1: Next | 0 / 1 | not started |\n| **v1.0** | **1 / 4** | in progress |",
        4,
      ),
    });
    expect(messages(checkProgress(repo))).toEqual([
      "Stage 0 shows 0 / 2, the feature tables have 1 / 2",
      "v1.0 shows 1 / 4, the feature tables have 1 / 3",
      '"Total: 4 features" but the feature tables have 3',
    ]);
  });
});
