import type { Finding, Repo } from "../repo";

// Scripts that aren't run by hand.
const UNLISTED_SCRIPTS = new Set(["start", "prepare"]);
// pnpm's own commands, not package scripts.
const PNPM_COMMANDS = new Set(["install", "exec", "dlx", "add", "remove"]);

/** CLAUDE.md "Commands" and package.json scripts list the same commands. */
export function checkCommands(repo: Repo): Finding[] {
  const scripts = Object.keys(
    (JSON.parse(repo.read("package.json")) as { scripts?: object }).scripts ??
      {},
  );
  const lines = repo.read("CLAUDE.md").split("\n");
  const start = lines.findIndex((line) => line === "## Commands");
  if (start === -1) {
    return [
      { file: "CLAUDE.md", line: 1, message: 'No "## Commands" section' },
    ];
  }
  let end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  if (end === -1) end = lines.length;
  const section = lines.slice(start, end);
  const text = section.join("\n");
  const findings: Finding[] = [];

  section.forEach((line, offset) => {
    for (const match of line.matchAll(/\bpnpm ([a-z][\w:-]*)/g)) {
      const name = match[1] ?? "";
      if (!PNPM_COMMANDS.has(name) && !scripts.includes(name)) {
        findings.push({
          file: "CLAUDE.md",
          line: start + offset + 1,
          message: `Unknown script: pnpm ${name} (not in package.json)`,
        });
      }
    }
  });

  for (const script of scripts) {
    if (UNLISTED_SCRIPTS.has(script)) continue;
    const escaped = script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`(^|[\\s,(\`])${escaped}([\\s,).:\`]|$)`, "m").test(text)) {
      findings.push({
        file: "CLAUDE.md",
        line: start + 1,
        message: `Script "${script}" from package.json isn't listed in Commands`,
      });
    }
  }
  return findings;
}
