// Allowed: the platform unit of work uses the platform helper and implements its port.
import type { PlatformUnitOfWork } from "../../application/ports/platform-unit-of-work";
import { withPlatformTransaction } from "./platform-transaction";

export const platformUnitOfWork: PlatformUnitOfWork = withPlatformTransaction;
