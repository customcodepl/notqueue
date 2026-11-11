import type { Finding, Repo } from "../repo";

const FEATURES = "docs/FEATURES.md";

interface Count {
  done: number;
  total: number;
}

/** "Progress" and "Total: N features" match the feature tables' statuses. */
export function checkProgress(repo: Repo): Finding[] {
  const lines = repo.read(FEATURES).split("\n");
  const counted = new Map<string, Count>();
  const all: Count = { done: 0, total: 0 };
  let stage: string | undefined;
  let inFeatures = false;

  for (const line of lines) {
    if (line.startsWith("## ")) inFeatures = line === "## Features";
    if (!inFeatures) continue;
    const heading = /^### Stage (\d+):/.exec(line);
    if (heading) stage = heading[1];
    const row = /^\| (F-[A-Z0-9-]+) \|[^|]*\| ([a-z ]+) \|/.exec(line);
    if (!row || stage === undefined) continue;
    const status = row[2]?.trim();
    if (status === "dropped") continue;
    const count = counted.get(stage) ?? { done: 0, total: 0 };
    count.total += 1;
    all.total += 1;
    if (status === "done") {
      count.done += 1;
      all.done += 1;
    }
    counted.set(stage, count);
  }

  const findings: Finding[] = [];
  const expect = (line: number, label: string, shown: Count, real: Count) => {
    if (shown.done !== real.done || shown.total !== real.total) {
      findings.push({
        file: FEATURES,
        line,
        message: `${label} shows ${shown.done} / ${shown.total}, the feature tables have ${real.done} / ${real.total}`,
      });
    }
  };

  lines.forEach((line, index) => {
    const stageRow = /^\| (\d+): [^|]+\| (\d+) \/ (\d+) \|/.exec(line);
    if (stageRow) {
      const real = counted.get(stageRow[1] ?? "") ?? { done: 0, total: 0 };
      expect(
        index + 1,
        `Stage ${stageRow[1]}`,
        { done: Number(stageRow[2]), total: Number(stageRow[3]) },
        real,
      );
    }
    const totalRow = /^\| \*\*v1\.0\*\* \| \*\*(\d+) \/ (\d+)\*\* \|/.exec(
      line,
    );
    if (totalRow) {
      expect(
        index + 1,
        "v1.0",
        { done: Number(totalRow[1]), total: Number(totalRow[2]) },
        all,
      );
    }
    const totalLine = /^\*\*Total: (\d+) features\.\*\*$/.exec(line);
    if (totalLine && Number(totalLine[1]) !== all.total) {
      findings.push({
        file: FEATURES,
        line: index + 1,
        message: `"Total: ${totalLine[1]} features" but the feature tables have ${all.total}`,
      });
    }
  });
  return findings;
}
