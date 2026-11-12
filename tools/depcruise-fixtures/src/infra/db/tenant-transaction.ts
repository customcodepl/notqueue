// Allowed: a scoped helper builds on the raw transaction.
import { withTransaction } from "./transaction";

export const withTenantTransaction = withTransaction;
