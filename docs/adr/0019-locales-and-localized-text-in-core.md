# ADR-0019: Supported locales and `LocalizedText` in `core`

- **Status:** accepted
- **Date:** 2026-11-11
- **Related:** F-FOUND-I18N, F-TENANT-CORE, F-QUEUE-MODEL, F-QUEUE-CONFIG, F-NOTIF-CORE, [ADR-0015](0015-composition-root.md)

## Context
`src/i18n` is presentation-side: only `api` and `app` may import it (F-FOUND-REPO). Venue content such as `venues.name` and service names is stored as `LocalizedText` JSON (`{"pl": "...", "en": "..."}`) that falls back to the venue default (README). `infra` needs its type for the column, `application` needs the fallback when it picks notification templates or returns venue content, and both need the list of supported locales.

## Decision
The supported locales (`LOCALES`, `Locale`, `isLocale`), the `LocalizedText` type and its fallback resolver live in `src/core/i18n/` as pure code. `src/i18n` keeps what belongs to presentation: next-intl setup, message catalogs, locale detection from the request, formatters and the translator. Its locale list comes from `core`.

## Alternatives considered
- **Everything in `src/i18n`, with relaxed boundary rules:** `infra` and `application` would depend on a presentation module and, through it, on next-intl.
- **A copy of the locale list per layer:** adding a locale would mean editing several places that can drift apart.

## Consequences
- **Positive:**
  - one source for the supported locales;
  - the fallback rule is unit-tested once and used the same way by the API, use cases and UI.
- **Negative / accepted trade-offs:** `core` holds a list that is partly a product setting (the launch languages).
- **Follow-ups:** adding a locale means adding it to `LOCALES` and adding its catalog. `pnpm i18n:check` then lists every missing message.
