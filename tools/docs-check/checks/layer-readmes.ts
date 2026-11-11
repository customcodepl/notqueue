import { parseMarkdown } from "../markdown";
import type { Finding, Repo } from "../repo";

// src/app/ is exempt: its folders are Next.js routes.
export const LAYERS = ["core", "application", "infra", "api", "server", "i18n"];

/** Every folder directly under `src/<layer>/` is named as `folder/` in its README. */
export function checkLayerReadmes(repo: Repo): Finding[] {
  const findings: Finding[] = [];
  for (const layer of LAYERS) {
    const prefix = `src/${layer}/`;
    const folders = new Set(
      repo.files
        .filter((file) => file.startsWith(prefix))
        .map((file) => file.slice(prefix.length).split("/"))
        .filter((parts) => parts.length > 1)
        .map((parts) => parts[0] ?? ""),
    );
    if (folders.size === 0) continue;

    const readme = `${prefix}README.md`;
    if (!repo.exists(readme)) {
      findings.push({
        file: readme,
        line: 1,
        message: `Missing README for src/${layer}/`,
      });
      continue;
    }
    const named = new Set(
      parseMarkdown(repo.read(readme)).codeSpans.map((span) => span.text),
    );
    for (const folder of [...folders].sort()) {
      if (!named.has(`${folder}/`)) {
        findings.push({
          file: readme,
          line: 1,
          message: `Folder src/${layer}/${folder}/ isn't described (name it as \`${folder}/\`)`,
        });
      }
    }
  }
  return findings;
}
