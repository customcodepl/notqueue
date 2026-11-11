import path from "node:path";

import { parseMarkdown } from "../markdown";
import { type Finding, markdownFiles, type Repo } from "../repo";

const EXTERNAL = /^[a-z][a-z0-9+.-]*:/i;

/** Relative links point to existing files, and anchors to existing headings. */
export function checkLinks(repo: Repo): Finding[] {
  const findings: Finding[] = [];
  const slugs = new Map<string, Set<string>>();
  const slugsOf = (file: string) => {
    let set = slugs.get(file);
    if (!set) {
      set = new Set(parseMarkdown(repo.read(file)).headings.map((h) => h.slug));
      slugs.set(file, set);
    }
    return set;
  };

  for (const file of markdownFiles(repo)) {
    for (const link of parseMarkdown(repo.read(file)).links) {
      if (EXTERNAL.test(link.target)) continue;
      const [rawPath = "", anchor] = link.target.split("#", 2);
      const target = rawPath
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(file), decodeURI(rawPath)),
          )
        : file;
      if (!repo.exists(target.replace(/\/$/, ""))) {
        findings.push({
          file,
          line: link.line,
          message: `Broken link: ${link.target} (no ${target})`,
        });
        continue;
      }
      // Line anchors (#L42) in code files aren't headings.
      if (anchor && target.endsWith(".md") && !slugsOf(target).has(anchor)) {
        findings.push({
          file,
          line: link.line,
          message: `Broken anchor: ${link.target} (no heading #${anchor} in ${target})`,
        });
      }
    }
  }
  return findings;
}
