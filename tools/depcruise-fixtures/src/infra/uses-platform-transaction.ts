// Violation: platform-transaction-outside-its-unit-of-work.
import { withPlatformTransaction } from "./db/platform-transaction";

export const crossTenant = withPlatformTransaction;
