import { z } from "@hono/zod-openapi";

// Shared API formats for time (CLAUDE.md "Time", ADR-0014). Every endpoint
// uses these instead of ad-hoc strings.

/** An instant: ISO 8601 in UTC with `Z`. Emit with `toInstant`. */
export const Instant = z.iso.datetime().openapi("Instant", {
  description:
    "An instant in ISO 8601, UTC, with a `Z` suffix. Offsets such as `+01:00` are rejected.",
  example: "2026-03-29T01:30:00.000Z",
});

/** A calendar date, e.g. a business day. */
export const LocalDate = z.iso.date().openapi("LocalDate", {
  description: "A calendar date, `YYYY-MM-DD`.",
  example: "2026-10-25",
});

/** A wall-clock time; always read together with the venue's IANA timezone. */
export const WallClockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .openapi("WallClockTime", {
    description:
      "A local wall-clock time, `HH:mm` from 00:00 to 23:59, in the venue's timezone.",
    example: "18:30",
  });

/** A duration in whole seconds. */
export const DurationSeconds = z
  .number()
  .int()
  .nonnegative()
  .openapi("DurationSeconds", {
    description: "A duration in whole seconds.",
    example: 900,
  });

// Canonical names only: Intl also accepts fixed offsets (`+01:00`),
// `Etc/GMT-1` and lowercase names, none of which a venue may use.
const IANA_TIME_ZONES = new Set(Intl.supportedValuesOf("timeZone"));

/** A venue timezone: an IANA name such as `Europe/Warsaw`, never a fixed offset. */
export const IanaTimeZone = z
  .string()
  .refine((value) => IANA_TIME_ZONES.has(value), {
    message: "Must be a canonical IANA timezone name",
  })
  .openapi("IanaTimeZone", {
    description:
      "A canonical IANA timezone name. Fixed offsets and `Etc/*` zones are rejected.",
    example: "Europe/Warsaw",
  });

/** Adds `serverTime` to a response that drives countdowns (ADR-0014). */
export function withServerTime<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return schema.extend({ serverTime: Instant });
}

/** Serializes an instant in the `Instant` format. */
export function toInstant(date: Date): string {
  return date.toISOString();
}
