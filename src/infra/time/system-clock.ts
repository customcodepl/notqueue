import type { Clock } from "@/core/time/clock";

// Stage 0 demo (F-FOUND-DOCS, steps 15–16): a comment-only change. Not merged.
/** The function's clock (NTP-synced on Vercel). Wired in the composition root only. */
export const systemClock: Clock = {
  now: () => new Date(),
};
