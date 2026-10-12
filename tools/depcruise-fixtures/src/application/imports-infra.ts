// Violation: application-imports-outer-layer.
import { db } from "../infra/db";

export const applicationUsesDb = db;
