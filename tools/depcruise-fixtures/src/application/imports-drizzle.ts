// Violation: application-imports-db-client.
import { sql } from "drizzle-orm";

export const applicationUsesDrizzle = sql;
