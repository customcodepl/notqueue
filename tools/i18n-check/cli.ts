import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { LOCALES } from "../../src/core/i18n/locale";
import { type Catalogs, checkCatalogs } from "./check";

const MESSAGES_DIR = "src/i18n/messages";
// en.json is the type source of the catalogs (src/i18n/next-intl.d.ts).
const REFERENCE = "en";

// `pnpm i18n:check`: run from the repo root.
if (import.meta.url === `file://${process.argv[1]}`) {
  const catalogs: Catalogs = {};
  const missing: string[] = [];
  for (const locale of LOCALES) {
    const file = join(MESSAGES_DIR, `${locale}.json`);
    if (existsSync(file)) {
      catalogs[locale] = JSON.parse(readFileSync(file, "utf8")) as unknown;
    } else {
      missing.push(file);
    }
  }

  for (const file of missing) console.error(`${file}: catalog missing`);
  const findings = checkCatalogs(catalogs, REFERENCE);
  for (const { locale, key, message } of findings) {
    console.error(`${MESSAGES_DIR}/${locale}.json: ${key}: ${message}`);
  }

  const total = missing.length + findings.length;
  if (total > 0) {
    console.error(`\n${total} translation finding(s).`);
    process.exit(1);
  }
  console.log("i18n check passed.");
}
