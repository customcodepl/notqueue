// Violation: server-imported-outside-entry-points.
import { root } from "../server/root";

export const apiUsesServer = root;
