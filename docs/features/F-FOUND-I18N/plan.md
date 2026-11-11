# F-FOUND-I18N: i18n foundation

- **Stage:** 0 (Foundations)
- **Status:** plan approved (2026-11-11)
- **Depends on:** F-FOUND-REPO
- **Unblocks:** F-TENANT-CORE, F-DESIGN-SYSTEM, F-QUEUE-MODEL, F-NOTIF-CORE
- **ADRs:** [ADR-0014](../../adr/0014-api-conventions.md) (clients translate problems by `code`), [ADR-0015](../../adr/0015-composition-root.md), [ADR-0018](../../adr/0018-locale-resolved-per-request-without-locale-in-url.md) (decision 1), [ADR-0019](../../adr/0019-locales-and-localized-text-in-core.md) (decision 2)

## Goal
The deployed app renders in Polish or English, and the visitor can switch between them. Every UI string comes from a PL/EN catalog, and CI fails when a key is missing in either locale. `LocalizedText` and its fallback resolver are ready for `venues.name` in F-TENANT-CORE. Dates and times are formatted only through helpers that take an explicit `timeZone`.

## Scope
- **next-intl** (latest 4.x outside pnpm's minimum release age), set up **without i18n routing** (decision 1):
  - no locale in the URL, no `[locale]` segment, no proxy;
  - `src/i18n/request.ts` (`getRequestConfig`) resolves the locale from the request and loads its catalog;
  - the root layout reads it with `getLocale()` for `<html lang>`;
  - the App Router plugin is added in `next.config.ts`.

  next-intl brings `@swc/core` and `@parcel/watcher`, whose install scripts are added to `allowBuilds` as `false` in `pnpm-workspace.yaml` (pnpm 12 fails the install otherwise). The build and the runtime don't need them.
- **`cacheComponents` and `partialPrefetching` are turned off** in `next.config.ts` (template defaults from F-FOUND-REPO, deviation 2). With them on, switching the language leaves the old and the new page on screen at once (spike, 2026-11-11; see Risks). Without them, every page that reads the locale renders per request.
- **Locale resolution for this stage:** the `NEXT_LOCALE` cookie (explicit choice) → `Accept-Language` → the platform default `pl` (decision 4). The resolver is a pure function, so later features can insert their sources:
  - the venue's enabled and default locales (F-PUBLIC-VENUE);
  - the locale saved on the entry (F-I18N-CUSTOMER-LOCALE);
  - the staff member's profile (F-AUTH-LOGIN, if needed).
- **Supported locales in `core`** (`src/core/i18n/`):
  - `LOCALES = ["pl", "en"] as const`, the `Locale` type and an `isLocale` guard;
  - `LocalizedText` = `Partial<Record<Locale, string>>`, the shape stored as JSON (README);
  - `resolveLocalizedText(text, { locale, fallback })`: requested locale → the venue default (`fallback`) → the first non-empty value in `LOCALES` order. Empty or whitespace-only strings count as missing.

  These live in `core` because `application` and `infra` need them too: F-TENANT-CORE stores `venues.name`, and F-NOTIF-CORE picks templates by locale. Neither may import `src/i18n` (decision 2).
- **Zod schemas** for the API in `src/api/schemas/`: `Locale` and `LocalizedText` (at least one non-empty value, only supported keys). They aren't used by any endpoint yet, so `openapi.json` doesn't change.
- **Catalogs:** `src/i18n/messages/{pl,en}.json`, nested by surface (`common`, `home`, `errors`, later `join`, `status`, `staff`, `admin`, `operator`) (decision 3).
  - `en.json` is the type source: next-intl's `AppConfig` augmentation makes an unknown key a type error.
  - Messages use ICU syntax, and Polish plurals use `one` / `few` / `many` / `other`.
- **The `errors` namespace** holds one message per code in the `src/api/problems.ts` registry. A unit test checks that every registered code has a message, so a new code without a translation fails CI ([ADR-0014](../../adr/0014-api-conventions.md)).
- **Missing-key gate:** `pnpm i18n:check` (`tools/i18n-check/`, run in `pnpm check` and so in CI) (decision 5). It fails when:
  - a key exists in one locale but not the other;
  - a message isn't valid ICU (parsed with `intl-messageformat`'s parser);
  - the PL and EN versions of a message use different arguments;
  - a Polish plural lacks `one`, `few`, `many` or `other`;
  - a message is empty.
- **Formatters** in `src/i18n/format.ts`, thin wrappers over next-intl's formatter (decision 6). Each one requires `timeZone: IanaTimeZone`, except calendar dates:
  - `formatInstant` (an ISO instant as a date and time);
  - `formatTime` (as a time of day; 12h/24h follows the locale);
  - `formatWallClock` (`HH:mm` plus the venue timezone, for opening hours);
  - `formatCalendarDate` (`YYYY-MM-DD` with no timezone conversion);
  - `formatRelative(instant, { now, timeZone })`, where `now` comes from `serverTime` or the `Clock` and never from `Date.now()`.

  A lint rule (`no-restricted-imports` / `no-restricted-syntax`) blocks the formatter APIs (`useFormatter`, `getFormatter`, `format.dateTime`) outside `src/i18n/`. The global next-intl `timeZone` is set to `UTC`, so a missed path shows visibly wrong times instead of plausible ones.
- **Server-side translator for non-React code:** `getTranslator(locale, namespace)` built on next-intl's `createTranslator`. F-NOTIF-CORE renders templates through a port, and `src/server/` wires this function into that port. This feature only provides the function.
- **App shell:**
  - the root layout sets `<html lang>` from the resolved locale, and the metadata title is translated;
  - Server Components translate by default. Client components get only their namespaces through `NextIntlClientProvider` (decision 7);
  - the placeholder home page is replaced by a translated page with an unstyled language switcher (two buttons, the current one marked with `aria-current`). The switcher sets the cookie and calls `router.refresh()` inside `useTransition`. The old page stays visible until the new one arrives, and the buttons are disabled while it's pending (decision 8).
- **Docs:**
  - `src/i18n/README.md`: how to add a key, how to add a locale, the formatter rule;
  - `tools/i18n-check/README.md` plus a doc-map entry for it;
  - CLAUDE.md "Commands": `i18n:check`;
  - Stage 0 demo step 17.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Pseudo-locale (accented, ~40% longer) and text-expansion checks | F-DESIGN-SYSTEM |
| Venue enabled/default locales as a resolution source; locale in public venue pages | F-PUBLIC-VENUE (columns: F-TENANT-CORE) |
| Language switcher on the join and status pages | F-QUEUE-JOIN |
| Saving a mid-wait language change on the entry | F-I18N-CUSTOMER-LOCALE |
| Admin UI for venue locales | F-VENUE-LOCALES |
| Notification templates and their rendering port | F-NOTIF-CORE |
| ETA range rounding (to 5 minutes) | F-QUEUE-MODEL (`core`); its display message comes with the screen |
| Unused-key detection | Not planned now; revisit in F-I18N-COMPLETE |
| Full content pass | F-I18N-COMPLETE |

## Affected modules
- **core:** `src/core/i18n/` (locales, `LocalizedText`, resolver) with tests.
- **i18n:** `request.ts`, `locale.ts` (resolution from cookie and `Accept-Language`), `format.ts`, `translator.ts`, `messages/`, type augmentation, README.
- **api:** `src/api/schemas/` (`Locale`, `LocalizedText`); a test that pairs problem codes with `errors` messages.
- **app:** `layout.tsx`, `page.tsx`, a `LocaleSwitcher` client component.
- **Repo:** `next.config.ts` (next-intl plugin; `cacheComponents` and `partialPrefetching` off), `pnpm-workspace.yaml` (`allowBuilds`), `package.json` (`next-intl`, `intl-messageformat` or `@formatjs/icu-messageformat-parser` as a devDependency, script `i18n:check`), ESLint config (formatter rule), `tools/i18n-check/`, `docs/doc-map.json`, `.dependency-cruiser.cjs` only if the new paths need it.

## Data model and API changes
None. No migration and no endpoint. The `Locale` and `LocalizedText` schemas are added but not used by any route yet.

## Conventions
- **i18n:** every string on the new page, in the switcher and in the metadata comes from the catalogs, in PL and EN. The placeholder exemption from F-FOUND-REPO ends here.
- **Time:**
  - formatters always take the venue's IANA timezone and never read the system clock (`now` is a parameter);
  - 12h/24h follows the locale;
  - tests use fixed instants and cover the DST switches (2026-03-29, 2026-10-25 in `Europe/Warsaw`) and a time range that crosses midnight.
- **Layers:**
  - `core/i18n` is pure;
  - `src/i18n` imports only `core`;
  - `application` and `infra` use only `core/i18n` (checked by dependency-cruiser).
- **GDPR:**
  - the `NEXT_LOCALE` cookie holds only `pl` or `en`; it's a functional cookie set at the user's request, so it needs no consent banner;
  - no PII is involved.
- **UI:** unstyled default elements, as in Stage 1 (DESIGN.md decisions are pending until Stage 2). The switcher is keyboard-accessible, and each button carries the language name in that language (`lang` attribute).
- **Tenant isolation, outbox, notifications, migrations:** none, because there is no data access.

## UI screens
Only the placeholder home page (translated heading plus the switcher). It isn't covered by DESIGN.md and is replaced later.

## Test plan
- **Unit:**
  - `resolveLocalizedText`: requested locale present; falls back to the venue default; falls back to the first non-empty value; empty strings and unknown keys are ignored;
  - locale resolution: cookie wins; `Accept-Language` with q-values and region tags (`pl-PL`, `en-GB;q=0.8`); unsupported languages fall back to `pl`; an invalid cookie value is ignored;
  - formatters: PL and EN output for a fixed instant in `Europe/Warsaw` and `Europe/London`; both DST switches; a wall-clock time that crosses midnight; `formatCalendarDate` doesn't shift the date in any timezone; `formatRelative` with an injected `now`;
  - Polish plurals: 1, 2, 5, 12, 22 and 25 pick the right forms;
  - every problem code has an `errors` message in both locales;
  - Zod schemas for `Locale` and `LocalizedText`.
- **i18n-check:** fixture catalogs with each kind of error (missing key, invalid ICU, argument mismatch, incomplete Polish plural, empty message). The test asserts the exact set of findings, as the dependency-cruiser fixture test does.
- **Lint rule:** a fixture or an ESLint `RuleTester` case proves that `useFormatter` outside `src/i18n/` is rejected.
- **E2E (all three Playwright projects):**
  - first visit with `Accept-Language: en` shows English and `<html lang="en">`;
  - with `pl`, or no header, it shows Polish;
  - the switcher changes the language, and the choice survives a reload.
- **Integration:** none, because there is no database access.
- **Manual:** the Stage 0 demo step 17 on the deployed preview.

## Implementation steps
1. `build(i18n): add next-intl with request-scoped locale`: dependency (`allowBuilds`), plugin, `cacheComponents` and `partialPrefetching` off, `request.ts`, `en.json` / `pl.json` with the home strings, type augmentation, root layout with `lang`.
2. `feat(core): add locales and localized text resolver`: `src/core/i18n/` with tests.
3. `feat(i18n): resolve locale from cookie and accept-language`: `locale.ts` with tests, used by `request.ts`.
4. `feat(i18n): add timezone-explicit formatters`: `format.ts` with tests, the lint rule with its proof, global `timeZone: "UTC"`.
5. `feat(api): add locale and localized text schemas`: Zod schemas, the `errors` namespace, the problem-code test.
6. `build(i18n): add missing-key check`: `tools/i18n-check/` with fixtures and tests, `pnpm i18n:check` in `pnpm check`, README, doc map, CLAUDE.md "Commands".
7. `feat(i18n): add server-side translator`: `translator.ts` with a test.
8. `feat(ui): translate home page and add language switcher`: page, switcher, E2E tests.
9. `docs(i18n): document i18n foundation`: `src/i18n/README.md`, Stage 0 demo step 17, FEATURES and ROADMAP updates.

## Done when
- The Stage 0 "Done when" part "the deployed app switches PL/EN" is shown on the preview (demo step 17).
- `pnpm i18n:check` runs in CI and fails on a missing key (shown by its fixture test and once by hand on a throwaway commit).
- No user-facing string in `src/app/` is hardcoded.
- Baseline: lint, typecheck, unit, integration and E2E tests pass in CI; `pnpm docs:check` is green and the `docs:map` review is recorded in the PR; every new string exists in PL and EN. Cross-tenant isolation doesn't apply (no endpoints).
- FEATURES.md: F-FOUND-I18N is `done`; Stage 0 is `done` once its demo has been run; "Next up" points to the next code-track feature.

## Risks and open questions
- **`cacheComponents` is off (spike, 2026-11-11, Next.js 16.4.4, next-intl 4.14.10).**
  - **Why it can't stay on:** with it on, `cookies()` may only be read inside `<Suspense>`, and `<html lang>` can't be wrapped. So the locale must be a route param, via a proxy rewrite to `[locale]` (next-intl `localePrefix: "never"`). That builds and prerenders `/pl` and `/en`. But switching the language on the client, with either `router.refresh()` or next-intl's `router.replace(pathname, { locale })`, leaves both pages on screen (two `<h1>`, in Chromium and WebKit). With `cacheComponents` and `partialPrefetching` off, the same setup switches cleanly. Keeping them on would need a full page reload on every switch, which works around a framework issue.
  - **What it costs:** no static shells, Partial Prerendering or partial prefetching. The customer pages read venue and queue data per request anyway, so the loss is small.
  - **Undoing it later:** it can be turned back on later if Next.js fixes root-layout param changes. That needs a `[locale]` segment and a proxy, and decision 1 would be revisited in a new ADR.
- **Every page renders per request.** Without the proxy, nothing is static. Vercel's CDN therefore never caches HTML that differs by cookie, and every response for the same URL is rendered fresh in the right language. Verified with the E2E tests and on the preview.
- **JS budget.** next-intl's client runtime adds a few KB gzip on top of the 207 KB baseline (F-FOUND-PIPELINE, deviation 7). Mitigations: Server Components translate by default, and client components get only their namespaces (decision 7). The size is measured and reported in the Deviations.
- **Polish plural categories.** `Intl.PluralRules("pl")` also has `many` for fractions, so ICU messages need `other` as well. The check requires all four categories.
- **Blocking ROADMAP questions:** none. Q2 (launch languages) is resolved: PL + EN, and PL is the longest locale.

## Decisions (approved 2026-11-11)
All recommendations accepted as written. Decision 1 was changed after a spike (see Risks) and is recorded in [ADR-0018](../../adr/0018-locale-resolved-per-request-without-locale-in-url.md); decision 2 in [ADR-0019](../../adr/0019-locales-and-localized-text-in-core.md).

1. **Locale routing ([ADR-0018](../../adr/0018-locale-resolved-per-request-without-locale-in-url.md)):** recommended **no locale in the URL and no i18n routing**. The locale is resolved per request in `getRequestConfig` (cookie → `Accept-Language` → default, later the venue's settings), and `cacheComponents` / `partialPrefetching` are turned off (see Risks). Reasons:
   - customer URLs come from QR codes and must work for every language;
   - the default depends on the venue, which a page knows and a proxy doesn't;
   - the app is not SEO-driven;
   - switching languages works without a full reload (spike).

   Alternatives:
   - next-intl's prefix routing (`/pl/...`, `/en/...`) puts a second variable into every QR link and route;
   - an internal `[locale]` segment with a proxy rewrite and `cacheComponents` on breaks client-side switching (spike);
   - the same segment with `cacheComponents` off works and keeps static per-locale pages. But it adds a proxy that can't know the venue's locales, and static pages matter little here.
2. **Where locales and `LocalizedText` live ([ADR-0019](../../adr/0019-locales-and-localized-text-in-core.md)):** recommended **`src/core/i18n/`**, with `src/i18n` limited to presentation (catalogs, formatters, next-intl), because `infra` (the `venues.name` column type) and `application` (notifications) need them and may not import `src/i18n`. Alternative: keep everything in `src/i18n` and relax the boundary rules.
3. **Catalog format:** recommended **one JSON file per locale, nested by surface**, with `en.json` as the type source. Alternative: one file per namespace and locale (better once catalogs grow; easy to split later).
4. **Platform default locale:** recommended **`pl`**, because the first clients are Polish and PL is also the longest locale for checks. Alternative: `en`.
5. **Missing-key gate:** recommended **our own small script** (`tools/i18n-check`, like `tools/docs-check`): key parity, ICU validity, argument parity, Polish plural categories. Alternative: a third-party checker such as `@lingual/i18n-check`, which is less code but adds a dependency and its own rules.
6. **Formatter enforcement:** recommended **wrappers with a required `timeZone` + a lint rule + global `timeZone: "UTC"`**, so a missing venue timezone can't silently render in the server's or browser's zone. Alternative: set the next-intl global `timeZone` per request and rely on review.
7. **Messages on the client:** recommended **Server Components translate; client components get only their namespaces** (`pick` in the provider), for the customer JS budget. Alternative: pass the whole catalog to the client (simpler, larger bundle).
8. **How the switcher saves the choice:** recommended **set the `NEXT_LOCALE` cookie on the client and refresh**: a UI preference, not domain data, so it doesn't go through `/api/v1`. Alternative: a `PUT /api/v1/preferences/locale` endpoint that sets the cookie, or a Server Action.

## Deviations
_To be filled in after implementation._
