import { type DocReviewItem, formatDocReview } from "./doc-map";

export type PrHookDecision =
  | { action: "ignore" }
  | { action: "allow"; stamp?: string }
  | { action: "deny"; stamp: string; reason: string };

// The command itself, not the text inside another command (a heredoc, a message).
export const PR_CREATE = /(?:^|[;&|(]\s*)gh\s+pr\s+create\b/m;

/**
 * The Claude Code hook before `gh pr create` (ADR-0017): the first attempt
 * for a branch state (HEAD) is denied with the full review list; the retry
 * for the same HEAD goes through. A new commit (e.g. a doc fix) asks again.
 */
export function prHookDecision(input: {
  command: string;
  head: string;
  stamp: string | undefined;
  review: DocReviewItem[];
}): PrHookDecision {
  if (!PR_CREATE.test(input.command)) return { action: "ignore" };
  if (input.stamp === input.head) return { action: "allow" };
  if (input.review.length === 0) return { action: "allow", stamp: input.head };
  return {
    action: "deny",
    stamp: input.head,
    reason: [
      "Doc review (ADR-0017) before opening the PR. Check every listed file against its doc:",
      ...formatDocReview(input.review).map((line) => `- ${line}`),
      'Update the docs (commit and push them) or decide they are current, describe it in the PR\'s "Docs" section, then run gh pr create again.',
    ].join("\n"),
  };
}
