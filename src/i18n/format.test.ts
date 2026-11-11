import { describe, expect, it } from "vitest";

import {
  formatCalendarDate,
  formatInstant,
  formatRelative,
  formatTime,
  formatWallClock,
} from "./format";

const WARSAW = "Europe/Warsaw";

// ICU separates the time and AM/PM with a narrow no-break space.
const plain = (text: string) => text.replace(/ /g, " ");

describe("formatInstant", () => {
  it("shows the instant in the given timezone and locale", () => {
    const instant = "2026-11-11T17:30:00Z";
    expect(formatInstant(instant, { locale: "pl", timeZone: WARSAW })).toBe(
      "11 lis 2026, 18:30",
    );
    expect(
      plain(formatInstant(instant, { locale: "en", timeZone: WARSAW })),
    ).toBe("Nov 11, 2026, 6:30 PM");
  });

  it("moves to the next day across midnight", () => {
    expect(
      formatInstant("2026-11-11T23:30:00Z", { locale: "pl", timeZone: WARSAW }),
    ).toBe("12 lis 2026, 00:30");
  });
});

describe("formatTime", () => {
  it("follows the locale's 12h or 24h style", () => {
    const instant = new Date("2026-11-11T23:30:00Z");
    expect(formatTime(instant, { locale: "pl", timeZone: WARSAW })).toBe(
      "00:30",
    );
    expect(plain(formatTime(instant, { locale: "en", timeZone: WARSAW }))).toBe(
      "12:30 AM",
    );
  });

  it("skips the missing hour when DST starts (2026-03-29)", () => {
    const at = (iso: string) =>
      formatTime(iso, { locale: "pl", timeZone: WARSAW });
    expect(at("2026-03-29T00:59:00Z")).toBe("01:59");
    expect(at("2026-03-29T01:00:00Z")).toBe("03:00");
  });

  it("repeats an hour when DST ends (2026-10-25)", () => {
    const at = (iso: string) =>
      formatTime(iso, { locale: "pl", timeZone: WARSAW });
    expect(at("2026-10-25T00:30:00Z")).toBe("02:30");
    expect(at("2026-10-25T01:30:00Z")).toBe("02:30");
  });

  it("depends only on the given timezone", () => {
    expect(
      formatTime("2026-03-29T01:30:00Z", {
        locale: "pl",
        timeZone: "Europe/London",
      }),
    ).toBe("02:30");
  });
});

describe("formatWallClock", () => {
  it("formats HH:mm without converting it", () => {
    expect(formatWallClock("00:30", { locale: "pl" })).toBe("00:30");
    expect(formatWallClock("18:05", { locale: "pl" })).toBe("18:05");
    expect(plain(formatWallClock("00:30", { locale: "en" }))).toBe("12:30 AM");
    expect(plain(formatWallClock("18:05", { locale: "en" }))).toBe("6:05 PM");
  });

  it("rejects values that aren't HH:mm", () => {
    for (const value of ["24:00", "7:30", "18:60", ""]) {
      expect(() => formatWallClock(value, { locale: "pl" })).toThrow(
        RangeError,
      );
    }
  });
});

describe("formatCalendarDate", () => {
  it("never shifts the date", () => {
    expect(formatCalendarDate("2026-10-25", { locale: "pl" })).toBe(
      "25 paź 2026",
    );
    expect(formatCalendarDate("2026-03-29", { locale: "en" })).toBe(
      "Mar 29, 2026",
    );
  });

  it("rejects invalid dates", () => {
    for (const value of ["2026-02-30", "2026-13-01", "25.10.2026", ""]) {
      expect(() => formatCalendarDate(value, { locale: "pl" })).toThrow(
        RangeError,
      );
    }
  });
});

describe("formatRelative", () => {
  it("is relative to the given now, not the device clock", () => {
    const now = "2026-11-11T18:00:00Z";
    expect(formatRelative("2026-11-11T18:05:00Z", { locale: "pl", now })).toBe(
      "za 5 minut",
    );
    expect(formatRelative("2026-11-11T17:00:00Z", { locale: "en", now })).toBe(
      "1 hour ago",
    );
  });
});
