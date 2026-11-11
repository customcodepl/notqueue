import type { Finding, Repo } from "../repo";

const INDEX = "docs/adr/README.md";
const ADR_FILE = /^docs\/adr\/(\d{4})-[a-z0-9-]+\.md$/;

/** `superseded by [ADR-0010](…)` and `superseded by 0010` mean the same. */
function normalizeStatus(status: string): string {
  return status
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/ADR-(\d{4})/g, "$1")
    .trim();
}

/** Every ADR file has one index row with the same title and status. */
export function checkAdrIndex(repo: Repo): Finding[] {
  const findings: Finding[] = [];
  const rows = new Map<
    string,
    { title: string; status: string; line: number }
  >();
  repo
    .read(INDEX)
    .split("\n")
    .forEach((line, index) => {
      const cells = line.split("|").map((cell) => cell.trim());
      const number = /^\[(\d{4})\]\(/.exec(cells[1] ?? "")?.[1];
      if (!number) return;
      if (rows.has(number)) {
        findings.push({
          file: INDEX,
          line: index + 1,
          message: `ADR-${number} is listed twice`,
        });
      }
      rows.set(number, {
        title: cells[2] ?? "",
        status: normalizeStatus(cells[3] ?? ""),
        line: index + 1,
      });
    });

  for (const file of repo.files) {
    const number = ADR_FILE.exec(file)?.[1];
    if (!number) continue;
    const text = repo.read(file);
    const title = /^# ADR-\d{4}: (.+)$/m.exec(text)?.[1]?.trim() ?? "";
    const status = normalizeStatus(
      /^- \*\*Status:\*\* (.+)$/m.exec(text)?.[1] ?? "",
    );
    const row = rows.get(number);
    rows.delete(number);
    if (!row) {
      findings.push({
        file: INDEX,
        line: 1,
        message: `ADR-${number} (${file}) is missing from the index`,
      });
      continue;
    }
    if (row.title !== title) {
      findings.push({
        file: INDEX,
        line: row.line,
        message: `ADR-${number} title "${row.title}" differs from the file: "${title}"`,
      });
    }
    if (row.status !== status) {
      findings.push({
        file: INDEX,
        line: row.line,
        message: `ADR-${number} status "${row.status}" differs from the file: "${status}"`,
      });
    }
  }

  for (const [number, row] of rows) {
    findings.push({
      file: INDEX,
      line: row.line,
      message: `ADR-${number} is in the index but has no file`,
    });
  }
  return findings;
}
