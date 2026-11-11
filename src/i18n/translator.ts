import {
  createTranslator,
  type Messages,
  type NamespaceKeys,
  type NestedKeyOf,
} from "next-intl";

import type { Locale } from "@/core/i18n/locale";

import en from "./messages/en.json";
import pl from "./messages/pl.json";

const CATALOGS: Record<Locale, Messages> = { pl, en };

/**
 * Translates outside React, e.g. notification templates (F-NOTIF-CORE):
 * `src/server/` wires it into the port that renders them. React code uses
 * `getTranslations` / `useTranslations` instead.
 */
export function getTranslator<
  const Namespace extends NamespaceKeys<Messages, NestedKeyOf<Messages>>,
>(locale: Locale, namespace: Namespace) {
  return createTranslator({
    locale,
    messages: CATALOGS[locale],
    namespace,
    // As in request.ts: dates go through format.ts with the venue's timezone.
    timeZone: "UTC",
  });
}
