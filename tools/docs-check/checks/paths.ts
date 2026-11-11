import { matchesAny } from "../glob";
import { parseMarkdown } from "../markdown";
import { type Finding, markdownFiles, type Repo } from "../repo";

/**
 * Docs that describe the repo as it is now. Plans and ADRs record history
 * and may name planned, renamed or rejected files (ADR-0017).
 */
export const LIVING_DOCS = [
  "README.md",
  "CLAUDE.md",
  "src/**/README.md",
  "tools/**/README.md",
  "docs/ROADMAP.md",
  "docs/FEATURES.md",
  "docs/DESIGN.md",
  "docs/demos/*.md",
];

const REPO_PATH = /^(src|docs|tools|e2e|supabase|\.github)\//;
// Placeholders and patterns, not concrete paths.
const NOT_A_PATH = /[<>*{}\s]|\.\.\.|NNNN/;

/** Backticked repo paths in living docs exist. */
export function checkPaths(repo: Repo): Finding[] {
  const findings: Finding[] = [];
  for (const file of markdownFiles(repo)) {
    if (!matchesAny(file, LIVING_DOCS)) continue;
    for (const span of parseMarkdown(repo.read(file)).codeSpans) {
      if (!REPO_PATH.test(span.text) || NOT_A_PATH.test(span.text)) continue;
      const target = span.text.replace(/[#:].*$/, "").replace(/\/$/, "");
      if (!repo.exists(target)) {
        findings.push({
          file,
          line: span.line,
          message: `Path doesn't exist: ${span.text}`,
        });
      }
    }
  }
  return findings;
}
