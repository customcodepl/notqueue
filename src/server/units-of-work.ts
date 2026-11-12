import { getDb } from "@/infra/db/client";
import {
  drizzlePlatformUnitOfWork,
  drizzleTenantUnitOfWork,
} from "@/infra/db/unit-of-work";

// Wired here once (ADR-0015, ADR-0022). The first use cases come with
// F-AUTH-RBAC (tenant) and F-PLATFORM-CONSOLE (platform).
export const tenantUnitOfWork = drizzleTenantUnitOfWork(getDb);
export const platformUnitOfWork = drizzlePlatformUnitOfWork(getDb);
