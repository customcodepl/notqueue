// Allowed: the platform module uses the platform port.
import type { PlatformUnitOfWork } from "../ports/platform-unit-of-work";

export const createOrganization = (unitOfWork: PlatformUnitOfWork) =>
  unitOfWork();
