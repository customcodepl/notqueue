# i18n

Presentation-side localization: next-intl setup, message catalogs, `LocalizedText` resolution and formatters (always in the venue's timezone). The locale is resolved per request and never appears in the URL ([ADR-0018](../../docs/adr/0018-locale-resolved-per-request-without-locale-in-url.md)).

- **May import:** `core`.
- **Imported only by:** `api`, `app`. `core`, `application` and `infra` never import `i18n`.

## Files
- `request.ts`: loaded by the next-intl plugin for every request; resolves the locale and loads its catalog.
- `locale.ts`: resolves the request locale from the `NEXT_LOCALE` cookie (the explicit choice), then `Accept-Language`, then the platform default.
- `format.ts`: the only way to display dates and times. Instants take the venue's IANA timezone; wall-clock times and calendar dates are never converted; relative times take `now` from `serverTime` or the `Clock`. A lint rule rejects next-intl's formatters and `Intl` date formatting elsewhere, and the global next-intl `timeZone` is `UTC`.
- `translator.ts`: `getTranslator(locale, namespace)` for code outside React, such as notification templates; `src/server/` wires it into the port that needs it.
- `messages/`: one catalog per locale (`en.json`, `pl.json`), nested by surface. `en.json` is the type source (`next-intl.d.ts`), so an unknown key is a type error.
