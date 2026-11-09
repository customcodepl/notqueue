import { z } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import {
  DurationSeconds,
  IanaTimeZone,
  Instant,
  LocalDate,
  toInstant,
  WallClockTime,
  withServerTime,
} from "./time";

function accepts(schema: z.ZodType, values: unknown[]) {
  for (const value of values) {
    expect(schema.safeParse(value).success, String(value)).toBe(true);
  }
}

function rejects(schema: z.ZodType, values: unknown[]) {
  for (const value of values) {
    expect(schema.safeParse(value).success, String(value)).toBe(false);
  }
}

describe("time schemas", () => {
  it("Instant: UTC with Z only", () => {
    // Around the March DST switch in Europe/Warsaw.
    accepts(Instant, ["2026-03-29T01:00:00Z", "2026-03-29T01:00:00.123Z"]);
    rejects(Instant, [
      "2026-03-29T03:00:00+02:00",
      "2026-03-29T01:00Z",
      "2026-03-29",
      1774746000000,
    ]);
  });

  it("LocalDate: real calendar dates", () => {
    accepts(LocalDate, ["2026-10-25", "2028-02-29"]);
    rejects(LocalDate, [
      "2026-02-29",
      "2026-02-30",
      "2026-13-01",
      "25.10.2026",
    ]);
  });

  it("WallClockTime: 00:00 to 23:59", () => {
    accepts(WallClockTime, ["00:00", "02:30", "23:59"]);
    rejects(WallClockTime, ["24:00", "7:30", "12:60", "12:30:00"]);
  });

  it("DurationSeconds: non-negative integers", () => {
    accepts(DurationSeconds, [0, 900]);
    rejects(DurationSeconds, [-5, 1.5, "900"]);
  });

  it("IanaTimeZone: canonical names, no fixed offsets", () => {
    accepts(IanaTimeZone, [
      "Europe/Warsaw",
      "Europe/London",
      "America/New_York",
    ]);
    rejects(IanaTimeZone, [
      "Europe/Atlantis",
      "+01:00",
      "Etc/GMT-1",
      "europe/warsaw",
      "CET",
    ]);
  });

  it("withServerTime adds an Instant field", () => {
    const schema = withServerTime(z.object({ position: z.number() }));
    accepts(schema, [{ position: 3, serverTime: "2026-10-25T00:30:00.000Z" }]);
    rejects(schema, [{ position: 3 }, { position: 3, serverTime: "now" }]);
  });

  it("toInstant always emits UTC with milliseconds and Z", () => {
    expect(toInstant(new Date(Date.UTC(2026, 9, 25, 1, 0, 0)))).toBe(
      "2026-10-25T01:00:00.000Z",
    );
  });
});
