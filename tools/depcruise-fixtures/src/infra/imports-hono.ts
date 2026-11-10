// Violation: application-or-infra-imports-hono.
import { Hono } from "hono";

export const infraUsesHono = Hono;
