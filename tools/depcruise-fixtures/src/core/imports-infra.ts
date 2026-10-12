// Violation: core-imports-other-layer.
import { db } from "../infra/db";

export const coreUsesDb = db;
