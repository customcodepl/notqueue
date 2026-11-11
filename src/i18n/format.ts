import { createFormatter } from "next-intl";

import type { Locale } from "@/core/i18n/locale";

// The only place that formats dates and times for display (a lint rule keeps
// next-intl's formatters and Intl date formatting out of other modules).
// Instants are always shown in the venue's timezone, which callers must pass:
// there is no implicit server or browser zone. `timeZone` is an IANA name,
// validated where it enters the system (`IanaTimeZone` in the API schemas).

interface InZone {
  locale: Locale;
  timeZone: string;
}

/** An instant as a date and time, e.g. `11 lis 2026, 18:30`. */
export function formatInstant(
  instant: Date | string,
  { locale, timeZone }: InZone,
): string {
  return createFormatter({ locale, timeZone }).dateTime(new Date(instant), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** An instant as a time of day; 12h or 24h follows the locale. */
export function formatTime(
  instant: Date | string,
  { locale, timeZone }: InZone,
): string {
  return createFormatter({ locale, timeZone }).dateTime(new Date(instant), {
    timeStyle: "short",
  });
}

/**
 * A wall-clock time (`HH:mm`, e.g. opening hours) in the locale's style.
 * It is already in the venue's timezone, so nothing is converted.
 */
export function formatWallClock(
  time: string,
  { locale }: { locale: Locale },
): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) throw new RangeError(`Invalid wall-clock time: ${time}`);
  const asUtc = new Date(
    Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])),
  );
  return createFormatter({ locale, timeZone: "UTC" }).dateTime(asUtc, {
    timeStyle: "short",
  });
}

/** A calendar date (`YYYY-MM-DD`, e.g. a business day), never shifted. */
export function formatCalendarDate(
  date: string,
  { locale }: { locale: Locale },
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const asUtc = match
    ? new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
      )
    : new Date(NaN);
  if (
    Number.isNaN(asUtc.getTime()) ||
    asUtc.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }
  return createFormatter({ locale, timeZone: "UTC" }).dateTime(asUtc, {
    dateStyle: "medium",
  });
}

/**
 * An instant relative to `now`, e.g. `za 5 minut`. `now` comes from the
 * response's `serverTime` or the `Clock`, never from the device clock.
 */
export function formatRelative(
  instant: Date | string,
  { locale, now }: { locale: Locale; now: Date | string },
): string {
  return createFormatter({ locale }).relativeTime(
    new Date(instant),
    new Date(now),
  );
}
