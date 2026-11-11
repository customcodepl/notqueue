# ADR-0018: Locale resolved per request, without the locale in the URL

- **Status:** accepted
- **Date:** 2026-11-11
- **Related:** F-FOUND-I18N, F-PUBLIC-VENUE, F-QUEUE-JOIN, F-I18N-CUSTOMER-LOCALE, ROADMAP question 2

## Context
Customers reach a venue through a QR code or a link that is printed once and must work for every language. The customer's locale is resolved as explicit choice → browser language (if the venue enables it) → venue default (README), so the fallback depends on the venue, not on the URL. The app is not SEO-driven. Next.js 16 with `cacheComponents` lets the root layout read request data only inside `<Suspense>`, and `<html lang>` can't be wrapped that way. A spike on 2026-11-11 (Next.js 16.4.4, next-intl 4.14.10) showed that the workaround, a proxy rewrite to an internal `[locale]` segment, prerenders per locale but breaks client-side language switching while `cacheComponents` is on: the old and the new page stay on screen together.

## Decision
We keep the locale out of the URL and use next-intl without i18n routing. `getRequestConfig` resolves the locale per request: first the `NEXT_LOCALE` cookie, then `Accept-Language`, then the platform default `pl`. Later features insert the venue's enabled and default locales, the entry's saved locale and the staff profile. We turn `cacheComponents` and `partialPrefetching` off.

## Alternatives considered
- **Locale prefix in the URL (`/pl/...`, `/en/...`):** adds a second variable to every QR link and route, and the prefix can contradict the venue's default.
- **Proxy rewrite to `[locale]` with `cacheComponents` on:** language switching leaves both pages rendered; only a full page reload on every switch avoids it.
- **Proxy rewrite to `[locale]` with `cacheComponents` off:** works and keeps static per-locale pages. But the proxy can't know a venue's locales, and static pages bring little to pages that read venue and queue data per request.

## Consequences
- **Positive:**
  - one URL per page for every language;
  - venue-aware resolution happens where the venue is known;
  - language switching is a soft refresh.
- **Negative / accepted trade-offs:**
  - no static shells, Partial Prerendering or partial prefetching;
  - every page that reads the locale renders per request.
- **Follow-ups:**
  - F-PUBLIC-VENUE adds the venue's locales to the resolution;
  - turning `cacheComponents` back on (after a Next.js fix for root-layout param changes) needs a new ADR.
