# i18n-check

The missing-key gate for the message catalogs in `src/i18n/messages/` (F-FOUND-I18N). TypeScript run with `tsx`; the only dependency is `@formatjs/icu-messageformat-parser`. Unit tests in the Vitest `unit` project.

## `pnpm i18n:check`
Part of `pnpm check` and of the CI "Checks" job. Prints `file: key: message` per finding and fails if there are any. Every locale in `LOCALES` (`src/core/i18n/locale.ts`) needs a catalog. `en.json` is the reference, because it is also the type source.

| Finding | Rule |
|---|---|
| `missing` | A key exists in one catalog but not in another. |
| `not a string` / `empty` | Every leaf is a non-blank string. |
| `invalid ICU` | The message parses as ICU MessageFormat. |
| `arguments … differ` | A translation uses the same arguments (and tags) as the reference. |
| `plural … lacks` | A cardinal plural covers every category of its locale (`Intl.PluralRules`): PL `one`, `few`, `many`, `other`; EN `one`, `other`. Exact matches such as `=0` are extras. |

`check.test.ts` runs `fixtures/` (one case per finding) and asserts the exact set of findings, and checks that the real catalogs pass.
