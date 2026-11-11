import { describe, expect, it } from "vitest";

import { globToRegExp } from "./glob";
import { githubSlug, parseMarkdown } from "./markdown";

describe("githubSlug", () => {
  it.each([
    ["Stage 0: Foundations", "stage-0-foundations"],
    ["Tenancy, auth & operator console", "tenancy-auth--operator-console"],
    ["Composition root in `src/server/`", "composition-root-in-srcserver"],
    ["**Bold** [link](x.md) text", "bold-link-text"],
    ["CI/CD", "cicd"],
    ["snake_case and e.g. dots", "snake_case-and-eg-dots"],
  ])("%s → %s", (heading, slug) => {
    expect(githubSlug(heading)).toBe(slug);
  });
});

describe("parseMarkdown", () => {
  it("reads headings, links and code spans with line numbers", () => {
    const doc = parseMarkdown(
      [
        "# Title",
        "See [plan](docs/plan.md#goal) and `src/core/`.",
        "## Title",
      ].join("\n"),
    );
    expect(doc.headings.map((h) => [h.slug, h.line])).toEqual([
      ["title", 1],
      ["title-1", 3],
    ]);
    expect(doc.links).toEqual([{ target: "docs/plan.md#goal", line: 2 }]);
    expect(doc.codeSpans).toEqual([{ text: "src/core/", line: 2 }]);
  });

  it("skips fenced code and links inside inline code", () => {
    const doc = parseMarkdown(
      [
        "```markdown",
        "# Not a heading",
        "[not](a-link.md)",
        "```",
        "`[also not](a-link.md)` but [this](real.md)",
      ].join("\n"),
    );
    expect(doc.headings).toEqual([]);
    expect(doc.links.map((l) => l.target)).toEqual(["real.md"]);
  });
});

describe("globToRegExp", () => {
  it("matches ** across folders and * within one", () => {
    expect(globToRegExp("src/**/README.md").test("src/README.md")).toBe(true);
    expect(globToRegExp("src/**/README.md").test("src/a/b/README.md")).toBe(
      true,
    );
    expect(globToRegExp("docs/demos/*.md").test("docs/demos/stage-0.md")).toBe(
      true,
    );
    expect(globToRegExp("docs/demos/*.md").test("docs/demos/a/b.md")).toBe(
      false,
    );
    expect(globToRegExp("src/infra/**").test("src/infra/db/client.ts")).toBe(
      true,
    );
    expect(globToRegExp("package.json").test("tools/package.json")).toBe(false);
  });
});
