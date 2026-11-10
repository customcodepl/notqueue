import { describe, expect, it } from "vitest";

import { FakeClock } from "./clock";

describe("FakeClock", () => {
  it("starts at the given instant", () => {
    expect(new FakeClock("2026-03-29T00:30:00Z").now().toISOString()).toBe(
      "2026-03-29T00:30:00.000Z",
    );
  });

  it("advances and can be set", () => {
    const clock = new FakeClock("2026-10-25T00:59:59Z");
    clock.advance(1_000);
    expect(clock.now().toISOString()).toBe("2026-10-25T01:00:00.000Z");
    clock.set("2026-01-01T00:00:00Z");
    expect(clock.now().toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("returns copies that don't move the clock", () => {
    const clock = new FakeClock("2026-01-01T00:00:00Z");
    clock.now().setUTCFullYear(2030);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });

  it("rejects invalid instants", () => {
    expect(() => new FakeClock("not a date")).toThrow(RangeError);
    expect(() => new FakeClock("2026-01-01T00:00:00Z").set("nope")).toThrow(
      RangeError,
    );
  });
});
