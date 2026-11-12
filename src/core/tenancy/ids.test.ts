import { describe, expect, it } from "vitest";

import { isUuid, parseOrgId, parseVenueId } from "./ids";

describe("tenant IDs", () => {
  const id = "3F2504E0-4F89-41D3-9A0C-0305E82C3301";

  it("accepts UUIDs and normalizes them to lowercase", () => {
    expect(parseOrgId(id)).toBe(id.toLowerCase());
    expect(parseVenueId(id.toLowerCase())).toBe(id.toLowerCase());
  });

  it("rejects anything else, naming the kind of ID", () => {
    for (const value of ["", "org-1", `${id}x`, 42, null, undefined]) {
      expect(isUuid(value)).toBe(false);
      expect(() => parseOrgId(value)).toThrow("OrgId must be a UUID");
    }
  });
});
