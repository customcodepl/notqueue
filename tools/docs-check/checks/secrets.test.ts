import { describe, expect, it } from "vitest";

import { memoryRepo } from "../repo";
import { checkSecrets } from "./secrets";

const workflow = [
  "env:",
  "  TOKEN: ${{ secrets.VERCEL_TOKEN }}",
  "  HOST: ${{ vars.PRODUCTION_HOST }}",
  "  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}",
].join("\n");
const readme = (rows: string) =>
  `# App\n### Secrets and variables\n| Name |\n|---|\n${rows}\n### Next\n\`DATABASE_URL\`\n`;

describe("checkSecrets", () => {
  it("passes when every name is documented; GITHUB_TOKEN is exempt", () => {
    const repo = memoryRepo({
      ".github/workflows/deploy.yml": workflow,
      ".env.example": "# comment\nDATABASE_URL=\n",
      "README.md": readme(
        "| `VERCEL_TOKEN` |\n| `PRODUCTION_HOST` |\n| `DATABASE_URL` |",
      ),
    });
    expect(checkSecrets(repo)).toEqual([]);
  });

  it("reports secrets, variables and .env.example entries outside the section", () => {
    const repo = memoryRepo({
      ".github/workflows/deploy.yml": workflow,
      ".env.example": "DATABASE_URL=\n",
      "README.md": readme("| `VERCEL_TOKEN` |"),
    });
    expect(checkSecrets(repo).map((finding) => finding.message)).toEqual([
      'PRODUCTION_HOST (used in .github/workflows/deploy.yml) isn\'t in "Secrets and variables"',
      'DATABASE_URL (used in .env.example) isn\'t in "Secrets and variables"',
    ]);
  });

  it("reports a missing section", () => {
    const repo = memoryRepo({
      ".github/workflows/deploy.yml": workflow,
      "README.md": "# App\n",
    });
    expect(checkSecrets(repo)).toEqual([
      {
        file: "README.md",
        line: 1,
        message: 'No "### Secrets and variables" section',
      },
    ]);
  });
});
