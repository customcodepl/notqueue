import { type DocReviewItem, formatDocReview } from "./doc-map";

export type PrHookDecision =
  | { action: "ignore" }
  | { action: "allow"; stamp?: string }
  | { action: "deny"; stamp?: string; reason: string };

// The command itself, not the text inside another command (a heredoc, a message).
export const PR_CREATE = /(?:^|[;&|(]\s*)gh\s+pr\s+create\b/m;

// Git commands that move HEAD. The hook runs before the whole command, so a
// commit chained before `gh pr create` would be missing from the review.
const MOVES_HEAD =
  /(?:^|[;&|(]\s*)git\s+(?:-C\s+\S+\s+)?(?:commit|merge|revert|cherry-pick|rebase|pull|am)\b/m;

/**
 * The Claude Code hook before `gh pr create` (ADR-0021): the first attempt
 * for a branch state (HEAD) is denied and asks for the docs-reviewer agent,
 * with the doc map as a hint. The retry for the same HEAD goes through, and
 * so does a later HEAD whose only changes since the review are Markdown
 * (the review's own fixes). Any other new commit asks again.
 */
export function prHookDecision(input: {
  command: string;
  head: string;
  stamp: string | undefined;
  /** Files changed from the stamp to HEAD; undefined if the stamp isn't an ancestor. */
  changedSinceStamp: string[] | undefined;
  review: DocReviewItem[];
}): PrHookDecision {
  if (!PR_CREATE.test(input.command)) return { action: "ignore" };
  if (MOVES_HEAD.test(input.command)) {
    return {
      action: "deny",
      reason:
        "Doc review (ADR-0021): this command changes HEAD before gh pr create, so the review would miss those commits. Commit and push first, then run gh pr create as a command of its own.",
    };
  }
  if (input.stamp === input.head) return { action: "allow" };
  if (
    input.changedSinceStamp?.length &&
    input.changedSinceStamp.every((file) => file.endsWith(".md"))
  ) {
    return { action: "allow", stamp: input.head };
  }
  const hint = formatDocReview(input.review).map((line) => `- ${line}`);
  return {
    action: "deny",
    stamp: input.head,
    reason: [
      "Doc review (ADR-0021) before opening the PR: run the docs-reviewer agent (subagent_type docs-reviewer) on this branch, with the feature ID if there is one.",
      'Fix each finding, or say in the PR\'s "Docs" section why it needs no change; commit and push the fixes, then run gh pr create again.',
      ...(hint.length > 0
        ? [
            "Docs that docs/doc-map.json maps to this branch (a hint, not the limit):",
            ...hint,
          ]
        : []),
    ].join("\n"),
  };
}
