import { describe, expect, it } from "vitest";

import { clamp } from "@/core/clamp";

describe("clamp", () => {
  it("returns the value when it is within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns the bounds when the value is outside the range", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("rejects an inverted range", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });
});
