import { describe, expect, it } from "vitest";

import { buildInfo } from "./build-info";

describe("buildInfo", () => {
  it("uses the short commit SHA and the region on Vercel", () => {
    expect(
      buildInfo({
        NOTQUEUE_COMMIT_SHA: "1ad8b76c0ffee1234567890abcdef1234567890a",
        VERCEL_REGION: "fra1",
      }),
    ).toEqual({ version: "1ad8b76", region: "fra1" });
  });

  it("falls back to dev and local", () => {
    expect(buildInfo({ NOTQUEUE_COMMIT_SHA: "", VERCEL_REGION: "" })).toEqual({
      version: "dev",
      region: "local",
    });
    expect(buildInfo({})).toEqual({ version: "dev", region: "local" });
  });
});
