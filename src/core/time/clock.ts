/**
 * The only source of "now" for domain code: `core` never reads the system
 * clock. Instants stored in the database still come from its `now()`; a
 * Clock covers decisions and response metadata such as `serverTime`.
 */
export interface Clock {
  now(): Date;
}

/** A controllable clock for tests. Returns copies, so callers can't move it. */
export class FakeClock implements Clock {
  private current: number;

  constructor(start: Date | string) {
    this.current = new Date(start).getTime();
    if (Number.isNaN(this.current)) {
      throw new RangeError("FakeClock needs a valid start instant");
    }
  }

  now(): Date {
    return new Date(this.current);
  }

  set(instant: Date | string): void {
    const next = new Date(instant).getTime();
    if (Number.isNaN(next)) throw new RangeError("Invalid instant");
    this.current = next;
  }

  advance(milliseconds: number): void {
    this.current += milliseconds;
  }
}
