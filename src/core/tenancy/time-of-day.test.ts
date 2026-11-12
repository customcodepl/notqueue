import { describe, expect, it } from "vitest";

import { isTimeOfDay, minutesOfDay, parseTimeOfDay } from "./time-of-day";

describe("TimeOfDay", () => {
  it("accepts HH:mm from 00:00 to 23:59", () => {
    for (const value of ["00:00", "04:00", "18:30", "23:59"]) {
      expect(isTimeOfDay(value)).toBe(true);
    }
  });

  it("rejects 24:00, seconds and other shapes", () => {
    for (const value of ["24:00", "04:00:00", "4:00", "04:60", "", 400]) {
      expect(isTimeOfDay(value)).toBe(false);
    }
    expect(() => parseTimeOfDay("24:00")).toThrow(TypeError);
  });

  it("counts minutes since local midnight", () => {
    expect(minutesOfDay(parseTimeOfDay("00:00"))).toBe(0);
    expect(minutesOfDay(parseTimeOfDay("04:30"))).toBe(270);
    expect(minutesOfDay(parseTimeOfDay("23:59"))).toBe(1439);
  });
});
