// Allowed: app → application, core and i18n.
import { useCase } from "../application/use-case";
import { now } from "../core/clock";
import { t } from "../i18n/messages";

export const page = [useCase, now, t];
