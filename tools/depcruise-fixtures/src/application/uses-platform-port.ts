// Violation: platform-port-outside-platform-module.
import type { PlatformUnitOfWork } from "./ports/platform-unit-of-work";

export const tenantUseCase = (unitOfWork: PlatformUnitOfWork) => unitOfWork();
