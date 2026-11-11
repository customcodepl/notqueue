import { globToRegExp, matchesAny } from "./glob";
import type { Finding, Repo } from "./repo";

export const DOC_MAP_FILE = "docs/doc-map.json";

/** Code glob → the docs that describe that code (ADR-0017). */
export type DocMap = Record<string, string[]>;

// Changes that never require a doc review.
const NEVER_TRIGGERS = [
  "**/*.md",
  "**/*.test.ts",
  "**/*.int.test.ts",
  "e2e/**",
  "tools/depcruise-fixtures/**",
  "pnpm-lock.yaml",
];

export function readDocMap(repo: Repo): DocMap {
  return JSON.parse(repo.read(DOC_MAP_FILE)) as DocMap;
}

/** Mapped docs that the changed files require, with the files that require them. */
export function requiredDocs(
  changed: string[],
  map: DocMap,
): Map<string, string[]> {
  const required = new Map<string, string[]>();
  for (const file of changed) {
    if (matchesAny(file, NEVER_TRIGGERS)) continue;
    for (const [glob, docs] of Object.entries(map)) {
      if (!globToRegExp(glob).test(file)) continue;
      for (const doc of docs) {
        required.set(doc, [...(required.get(doc) ?? []), file]);
      }
    }
  }
  return required;
}

export interface DocReviewItem {
  doc: string;
  /** Every changed file that requires this doc, not only the first few. */
  files: string[];
  /** Whether the change touches the doc itself. */
  docChanged: boolean;
}

/** What to check before opening a PR: each mapped doc with all its changed files. */
export function docReview(changed: string[], map: DocMap): DocReviewItem[] {
  const touched = new Set(changed);
  return [...requiredDocs(changed, map)].map(([doc, files]) => ({
    doc,
    files,
    docChanged: touched.has(doc),
  }));
}

export function formatDocReview(items: DocReviewItem[]): string[] {
  return items.map(
    ({ doc, files, docChanged }) =>
      `${doc} (${docChanged ? "changed" : "not changed"} in this branch): ${files.join(", ")}`,
  );
}

/** For docs:check: the map itself is valid, its docs exist and its globs match files. */
export function checkDocMap(repo: Repo): Finding[] {
  if (!repo.exists(DOC_MAP_FILE)) {
    return [{ file: DOC_MAP_FILE, line: 1, message: "The doc map is missing" }];
  }
  const findings: Finding[] = [];
  for (const [glob, docs] of Object.entries(readDocMap(repo))) {
    const pattern = globToRegExp(glob);
    if (!repo.files.some((file) => pattern.test(file))) {
      findings.push({
        file: DOC_MAP_FILE,
        line: 1,
        message: `Glob ${glob} matches no file`,
      });
    }
    for (const doc of docs) {
      if (!repo.exists(doc)) {
        findings.push({
          file: DOC_MAP_FILE,
          line: 1,
          message: `Doc ${doc} (mapped from ${glob}) doesn't exist`,
        });
      }
    }
  }
  return findings;
}
