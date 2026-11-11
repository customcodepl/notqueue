import { globToRegExp, matchesAny } from "./glob";
import type { Finding, Repo } from "./repo";

export const DOC_MAP_FILE = "docs/doc-map.json";

/** Code glob → the docs that describe that code (ADR-0016). */
export type DocMap = Record<string, string[]>;

// Changes that never require a doc update.
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

export interface OptOut {
  doc: string;
  reason: string;
  line: number;
}

const OPT_OUT = /^\s*Docs-unchanged:\s*(\S+)\s*(?:[—–-]+\s*(.*))?$/;

/**
 * `Docs-unchanged: <doc> — <reason>` lines of a PR description. HTML
 * comments (the PR template's hint) are skipped; line numbers are kept.
 */
export function parseOptOuts(description: string): OptOut[] {
  return description
    .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ""))
    .split(/\r?\n/)
    .map((text, index) => ({ match: OPT_OUT.exec(text), line: index + 1 }))
    .filter(({ match }) => match !== null)
    .map(({ match, line }) => ({
      doc: match?.[1]?.replace(/^`|`$/g, "") ?? "",
      reason: match?.[2]?.trim() ?? "",
      line,
    }));
}

export interface MapResult {
  /** Required docs neither changed nor declared unchanged. */
  missing: { doc: string; files: string[] }[];
  /** Problems with the `Docs-unchanged:` lines themselves. */
  invalidOptOuts: string[];
}

export function evaluateDocMap(input: {
  changed: string[];
  map: DocMap;
  optOuts: OptOut[];
  exists: (file: string) => boolean;
}): MapResult {
  const changed = new Set(input.changed);
  const declared = new Set<string>();
  const invalidOptOuts: string[] = [];
  for (const optOut of input.optOuts) {
    if (!input.exists(optOut.doc)) {
      invalidOptOuts.push(
        `Docs-unchanged names ${optOut.doc}, which doesn't exist`,
      );
    } else if (!optOut.reason) {
      invalidOptOuts.push(
        `Docs-unchanged: ${optOut.doc} needs a reason: "Docs-unchanged: ${optOut.doc} — <reason>"`,
      );
    } else {
      declared.add(optOut.doc);
    }
  }
  const missing = [...requiredDocs(input.changed, input.map)]
    .filter(([doc]) => !changed.has(doc) && !declared.has(doc))
    .map(([doc, files]) => ({ doc, files }));
  return { missing, invalidOptOuts };
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
