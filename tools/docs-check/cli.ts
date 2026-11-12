import { checkAdrIndex } from "./checks/adr-index";
import { checkCommands } from "./checks/commands";
import { checkLayerReadmes } from "./checks/layer-readmes";
import { checkLinks } from "./checks/links";
import { checkPaths } from "./checks/paths";
import { checkProgress } from "./checks/progress";
import { checkSecrets } from "./checks/secrets";
import { checkDocMap } from "./doc-map";
import { type Finding, gitRepo, type Repo } from "./repo";

const CHECKS: Record<string, (repo: Repo) => Finding[]> = {
  links: checkLinks,
  paths: checkPaths,
  commands: checkCommands,
  adrIndex: checkAdrIndex,
  progress: checkProgress,
  layerReadmes: checkLayerReadmes,
  secrets: checkSecrets,
  docMap: checkDocMap,
};

export function runChecks(repo: Repo): Finding[] {
  return Object.values(CHECKS).flatMap((check) => check(repo));
}

// `pnpm docs:check` (ADR-0021): run from the repo root.
if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = runChecks(gitRepo(process.cwd()));
  for (const { file, line, message } of findings) {
    console.error(`${file}:${line}: ${message}`);
  }
  if (findings.length > 0) {
    console.error(`\n${findings.length} documentation finding(s).`);
    process.exit(1);
  }
  console.log("Docs check passed.");
}
