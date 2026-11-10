import { vi } from "vitest";

import type { ApiDeps } from "./app";

/** Fakes for `createApi` in tests; override what a test needs. */
export function fakeApiDeps(overrides: Partial<ApiDeps> = {}) {
  return {
    reportError: vi.fn(),
    checkHealth: () =>
      Promise.resolve({ serverTime: new Date("2026-03-29T01:00:00Z") }),
    build: { version: "abc1234", region: "test" },
    ...overrides,
  } satisfies ApiDeps;
}
