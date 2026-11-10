import { describe, expect, it } from "vitest";

import { FakeClock } from "@/core/time/clock";

import { checkHealth } from "./check-health";

describe("checkHealth", () => {
  it("reports the clock's time once the database answers", async () => {
    const clock = new FakeClock("2026-10-25T00:30:00Z");
    const check = checkHealth({
      database: {
        ping: () => {
          clock.advance(5);
          return Promise.resolve();
        },
      },
      clock,
    });
    expect(await check()).toEqual({
      serverTime: new Date("2026-10-25T00:30:00.005Z"),
    });
  });

  it("rejects with the database's error", async () => {
    const check = checkHealth({
      database: { ping: () => Promise.reject(new Error("refused")) },
      clock: new FakeClock("2026-10-25T00:30:00Z"),
    });
    await expect(check()).rejects.toThrow("refused");
  });
});
