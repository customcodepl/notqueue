import { describe, expect, it } from "vitest";

import { memoryRepo } from "../repo";
import { checkLayerReadmes } from "./layer-readmes";

describe("checkLayerReadmes", () => {
  it("passes when every folder is named, in headings or lists", () => {
    const repo = memoryRepo({
      "src/infra/README.md": "# infra\n## `db/`\n- `time/`: clocks",
      "src/infra/db/client.ts": "",
      "src/infra/db/schema/app.ts": "",
      "src/infra/time/system-clock.ts": "",
      "src/infra/index.ts": "",
      "src/app/dashboard/page.tsx": "",
    });
    expect(checkLayerReadmes(repo)).toEqual([]);
  });

  it("reports unnamed folders and missing READMEs", () => {
    const repo = memoryRepo({
      "src/core/README.md":
        "# core\nEvents live in `events` and src/core/time/.",
      "src/core/events/domain-event.ts": "",
      "src/core/time/clock.ts": "",
      "src/server/wiring/api.ts": "",
    });
    expect(checkLayerReadmes(repo).map((f) => f.message)).toEqual([
      "Folder src/core/events/ isn't described (name it as `events/`)",
      "Folder src/core/time/ isn't described (name it as `time/`)",
      "Missing README for src/server/",
    ]);
  });
});
