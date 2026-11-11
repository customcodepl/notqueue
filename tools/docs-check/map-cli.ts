import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import {
  evaluateDocMap,
  type MapResult,
  parseOptOuts,
  readDocMap,
} from "./doc-map";
import { gitRepo } from "./repo";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);

/** The branch against the merge base with `base`, plus uncommitted and new files. */
function localChanges(base: string): string[] {
  return [
    ...new Set([
      ...git("diff", "--name-only", `${base}...HEAD`),
      ...git("diff", "--name-only", "HEAD"),
      ...git("ls-files", "--others", "--exclude-standard"),
    ]),
  ];
}

function evaluate(changed: string[]): MapResult {
  const repo = gitRepo(process.cwd());
  return evaluateDocMap({
    changed,
    map: readDocMap(repo),
    optOuts: parseOptOuts(process.env.PR_BODY ?? ""),
    exists: repo.exists,
  });
}

function describe({ missing, invalidOptOuts }: MapResult): string[] {
  return [
    ...invalidOptOuts,
    ...missing.map(({ doc, files }) => {
      const shown = files.slice(0, 3).join(", ");
      const more = files.length > 3 ? ` and ${files.length - 3} more` : "";
      return `${doc} not updated (changed: ${shown}${more})`;
    }),
  ];
}

/**
 * Claude Code PreToolUse hook (.claude/settings.json): before a `git commit`,
 * tells Claude which mapped docs the branch hasn't updated. Never blocks.
 * Checks the whole branch: `git add … && git commit` stages files only after
 * the hook has run.
 */
function hook() {
  try {
    const input = JSON.parse(readFileSync(0, "utf8")) as {
      tool_input?: { command?: string };
    };
    if (!/\bgit\s+commit\b/.test(input.tool_input?.command ?? "")) return;
    const lines = describe(evaluate(localChanges("origin/main")));
    if (lines.length === 0) return;
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          additionalContext: [
            "Doc map (ADR-0016): this branch changes mapped code without its docs:",
            ...lines.map((line) => `- ${line}`),
            "Update them in this or a later commit of the PR, or plan a `Docs-unchanged: <doc> — <reason>` line for the PR description.",
          ].join("\n"),
        },
      }),
    );
  } catch {
    // A reminder must never get in the way of a commit.
  }
}

/**
 * `pnpm docs:map`: mapped docs that the change doesn't touch.
 * - `--base <ref>` (CI): the branch against the merge base with `<ref>`;
 *   `Docs-unchanged:` lines come from the PR description in PR_BODY.
 * - `--staged`: staged files only; a reminder, never fails.
 * - `--hook`: the Claude Code hook above.
 * - no flag (local): the branch against origin/main plus uncommitted changes.
 */
function main(args: string[]) {
  if (args.includes("--hook")) return hook();
  const staged = args.includes("--staged");
  const baseIndex = args.indexOf("--base");
  const base = baseIndex === -1 ? "origin/main" : args[baseIndex + 1];
  if (!base) throw new Error("--base needs a ref");

  const changed = staged
    ? git("diff", "--cached", "--name-only")
    : baseIndex === -1
      ? localChanges(base)
      : git("diff", "--name-only", `${base}...HEAD`);
  const lines = describe(evaluate(changed));
  for (const line of lines) console.error(line);

  if (lines.length === 0) {
    console.log("Doc map satisfied.");
    return;
  }
  if (staged) {
    console.error(
      "\nReminder (ADR-0016): update these docs in this or a later commit of the PR.",
    );
    return;
  }
  console.error(
    "\nUpdate the docs, or add one line per doc to the PR description:\n  Docs-unchanged: <doc> — <reason>",
  );
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
