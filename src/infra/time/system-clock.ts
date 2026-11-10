import type { Clock } from "@/core/time/clock";

/** The function's clock (NTP-synced on Vercel). Wired in the composition root only. */
export const systemClock: Clock = {
  now: () => new Date(),
};
