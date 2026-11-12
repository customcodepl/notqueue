import type { PlatformUnitOfWork } from "@/application/ports/platform-unit-of-work";
import type { TenantUnitOfWork } from "@/application/ports/tenant-unit-of-work";

import type { Db } from "./client";
import { drizzleEventOutbox } from "./outbox";
import { withPlatformTransaction } from "./platform-transaction";
import { withTenantTransaction } from "./tenant-transaction";

// Both take a getter, so the database is touched only on first use.

export function drizzleTenantUnitOfWork(getDb: () => Db): TenantUnitOfWork {
  return {
    run: (orgId, fn) =>
      withTenantTransaction(getDb(), orgId, (tx) =>
        fn({ orgId, outbox: drizzleEventOutbox(tx) }),
      ),
  };
}

export function drizzlePlatformUnitOfWork(getDb: () => Db): PlatformUnitOfWork {
  return {
    run: (fn) =>
      withPlatformTransaction(getDb(), (tx) =>
        fn({ outbox: drizzleEventOutbox(tx) }),
      ),
  };
}
