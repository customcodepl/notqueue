// Allowed: infra → application and core.
import { useCase } from "../application/use-case";
import { now } from "../core/clock";

export const db = [useCase, now];
