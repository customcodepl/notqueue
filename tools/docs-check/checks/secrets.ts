import type { Finding, Repo } from "../repo";

const SECTION = "### Secrets and variables";
// Provided by GitHub, never set by hand.
const BUILT_IN = new Set(["GITHUB_TOKEN"]);

/**
 * Every secret and variable a workflow reads (`secrets.X`, `vars.X`) and
 * every variable in `.env.example` has a row in the README's
 * "Secrets and variables" table.
 */
export function checkSecrets(repo: Repo): Finding[] {
  const used = new Map<string, string>();
  for (const file of repo.files) {
    if (!/^\.github\/workflows\/[^/]+\.ya?ml$/.test(file)) continue;
    for (const match of repo
      .read(file)
      .matchAll(/\b(?:secrets|vars)\.([A-Z][A-Z0-9_]*)\b/g)) {
      const name = match[1] ?? "";
      if (!BUILT_IN.has(name) && !used.has(name)) used.set(name, file);
    }
  }
  if (repo.exists(".env.example")) {
    for (const match of repo
      .read(".env.example")
      .matchAll(/^([A-Z][A-Z0-9_]*)=/gm)) {
      const name = match[1] ?? "";
      if (!used.has(name)) used.set(name, ".env.example");
    }
  }
  if (used.size === 0) return [];

  const lines = repo.read("README.md").split("\n");
  const start = lines.findIndex((line) => line === SECTION);
  if (start === -1) {
    return [{ file: "README.md", line: 1, message: `No "${SECTION}" section` }];
  }
  let end = lines.findIndex((line, i) => i > start && /^#{1,3} /.test(line));
  if (end === -1) end = lines.length;
  const documented = new Set(
    [
      ...lines
        .slice(start, end)
        .join("\n")
        .matchAll(/`([A-Z][A-Z0-9_]*)`/g),
    ].map((match) => match[1]),
  );

  return [...used]
    .filter(([name]) => !documented.has(name))
    .map(([name, source]) => ({
      file: "README.md",
      line: start + 1,
      message: `${name} (used in ${source}) isn't in "Secrets and variables"`,
    }));
}
