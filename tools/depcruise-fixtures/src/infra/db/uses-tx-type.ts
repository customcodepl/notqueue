// Allowed: an adapter bound to the caller's transaction imports only its type.
import type { Tx } from "./transaction";

export const outbox = (tx: Tx) => tx.kind;
