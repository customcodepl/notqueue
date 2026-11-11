import { execFileSync } from "node:child_process";

import { evaluateDocMap, parseOptOuts, readDocMap } from "./doc-map";
import { gitRepo } from "./repo";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);

/**
 * `pnpm docs:map`: mapped docs that the change doesn't touch.
 * - `--base <ref>` (CI): the branch against the merge base with `<ref>`;
 *   `Docs-unchanged:` lines come from the PR description in PR_BODY.
 * - `--staged` (Claude Code hook): staged files only; a reminder, never fails.
 * - no flag (local): the branch against origin/main plus uncommitted changes.
 */
function main(args: string[]) {
  const staged = args.includes("--staged");
  const baseIndex = args.indexOf("--base");
  const base = baseIndex === -1 ? "origin/main" : args[baseIndex + 1];
  if (!base) throw new Error("--base needs a ref");

  const changed = staged
    ? git("diff", "--cached", "--name-only")
    : [
        ...new Set([
          ...git("diff", "--name-only", `${base}...HEAD`),
          ...(baseIndex === -1
            ? [
                ...git("diff", "--name-only", "HEAD"),
                ...git("ls-files", "--others", "--exclude-standard"),
              ]
            : []),
        ]),
      ];
  const repo = gitRepo(process.cwd());
  const { missing, invalidOptOuts } = evaluateDocMap({
    changed,
    map: readDocMap(repo),
    optOuts: parseOptOuts(process.env.PR_BODY ?? ""),
    exists: repo.exists,
  });

  for (const message of invalidOptOuts) console.error(message);
  for (const { doc, files } of missing) {
    const shown = files.slice(0, 3).join(", ");
    const more = files.length > 3 ? ` and ${files.length - 3} more` : "";
    console.error(`${doc} not updated (changed: ${shown}${more})`);
  }

  if (missing.length === 0 && invalidOptOuts.length === 0) {
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
