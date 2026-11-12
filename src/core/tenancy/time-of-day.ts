declare const brand: unique symbol;

/**
 * A local wall-clock time, `HH:mm` from 00:00 to 23:59. It belongs to a venue
 * and is read in the venue's timezone; it is never converted to UTC.
 */
export type TimeOfDay = string & { readonly [brand]: "TimeOfDay" };

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === "string" && HH_MM.test(value);
}

export function parseTimeOfDay(value: unknown): TimeOfDay {
  if (!isTimeOfDay(value)) {
    throw new TypeError("A time of day must be HH:mm from 00:00 to 23:59");
  }
  return value;
}

/** Minutes since local midnight, e.g. `04:30` → 270. */
export function minutesOfDay(time: TimeOfDay): number {
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  return hours * 60 + minutes;
}
