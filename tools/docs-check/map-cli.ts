import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

import { docReview, formatDocReview, readDocMap } from "./doc-map";
import { PR_CREATE, prHookDecision } from "./pr-hook";
import { gitRepo } from "./repo";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);

/** The branch against its merge base with origin/main, plus uncommitted and new files. */
function branchChanges(): string[] {
  return [
    ...new Set([
      ...git("diff", "--name-only", "origin/main...HEAD"),
      ...git("diff", "--name-only", "HEAD"),
      ...git("ls-files", "--others", "--exclude-standard"),
    ]),
  ];
}

/** Files changed from `stamp` to `head`, or undefined if `stamp` isn't an ancestor. */
function changesSince(stamp: string, head: string): string[] | undefined {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", stamp, head]);
    return git("diff", "--name-only", stamp, head);
  } catch {
    return undefined;
  }
}

function review() {
  return docReview(branchChanges(), readDocMap(gitRepo(process.cwd())));
}

/**
 * Claude Code PreToolUse hook (.claude/settings.json). Denies the first
 * `gh pr create` per HEAD and asks for the docs reviewer; never breaks other
 * commands.
 */
function hook() {
  try {
    const input = JSON.parse(readFileSync(0, "utf8")) as {
      tool_input?: { command?: string };
    };
    const command = input.tool_input?.command ?? "";
    if (!PR_CREATE.test(command)) return;
    // Per clone, outside the work tree: never committed.
    const stampFile = git("rev-parse", "--git-path", "docs-review")[0] ?? "";
    let stamp: string | undefined;
    try {
      stamp = readFileSync(stampFile, "utf8").trim();
    } catch {
      stamp = undefined;
    }
    const head = git("rev-parse", "HEAD")[0] ?? "";
    const decision = prHookDecision({
      command,
      head,
      stamp,
      changedSinceStamp: stamp ? changesSince(stamp, head) : undefined,
      review: review(),
    });
    if (decision.action !== "ignore" && decision.stamp) {
      writeFileSync(stampFile, `${decision.stamp}\n`);
    }
    if (decision.action === "deny") {
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: decision.reason,
          },
        }),
      );
    }
  } catch {
    // The review aid must never break an unrelated command.
  }
}

/**
 * `pnpm docs:map`: every mapped doc that the branch's changes require, with
 * all the changed files. `--hook`: the Claude Code hook above.
 */
function main(args: string[]) {
  if (args.includes("--hook")) return hook();
  const lines = formatDocReview(review());
  if (lines.length === 0) {
    console.log("No mapped docs to review.");
    return;
  }
  console.log(
    "Docs mapped to this branch (ADR-0021; the docs-reviewer agent checks beyond them):",
  );
  for (const line of lines) console.log(`- ${line}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
