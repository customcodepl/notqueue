"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALES, type Locale } from "@/core/i18n/locale";
import { LOCALE_COOKIE } from "@/i18n/locale";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function saveChoice(locale: Locale) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax${secure}`;
}

// Saves the explicit choice in the cookie and re-renders on the server
// (ADR-0018). The old page stays visible until the new one arrives.
export function LocaleSwitcher() {
  const current = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    saveChoice(locale);
    startTransition(() => router.refresh());
  }

  return (
    <nav aria-label={t("label")}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          disabled={isPending}
          onClick={() => choose(locale)}
        >
          {t(`names.${locale}`)}
        </button>
      ))}
    </nav>
  );
}
