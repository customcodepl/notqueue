import type { Clock } from "@/core/time/clock";

import type { DatabaseHealth } from "../ports/database-health";

export interface HealthReport {
  serverTime: Date;
}

export type CheckHealth = () => Promise<HealthReport>;

/** Healthy when the database answers; rejects with the cause otherwise. */
export function checkHealth(deps: {
  database: DatabaseHealth;
  clock: Clock;
}): CheckHealth {
  return async () => {
    await deps.database.ping();
    return { serverTime: deps.clock.now() };
  };
}
