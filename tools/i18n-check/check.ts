import {
  type MessageFormatElement,
  parse,
  TYPE,
} from "@formatjs/icu-messageformat-parser";

export interface Finding {
  locale: string;
  key: string;
  message: string;
}

/** Catalogs by locale code; `reference` is the type source (en.json). */
export type Catalogs = Record<string, unknown>;

function flatten(
  value: unknown,
  prefix: string,
  out: Map<string, unknown>,
): void {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out.set(prefix, value);
  }
}

// Every argument a message uses, so translations can't drop or rename one.
function argumentsOf(elements: MessageFormatElement[], out: Set<string>) {
  for (const element of elements) {
    if (element.type === TYPE.literal || element.type === TYPE.pound) continue;
    out.add(element.value);
    if (element.type === TYPE.tag) argumentsOf(element.children, out);
    if (element.type === TYPE.plural || element.type === TYPE.select) {
      for (const option of Object.values(element.options)) {
        argumentsOf(option.value, out);
      }
    }
  }
}

// Plurals must cover every category the locale has (pl: one, few, many,
// other); exact matches such as `=0` are optional extras.
function pluralGaps(
  elements: MessageFormatElement[],
  categories: string[],
): string[] {
  const gaps: string[] = [];
  for (const element of elements) {
    if (element.type === TYPE.plural && element.pluralType === "cardinal") {
      const missing = categories.filter((c) => !(c in element.options));
      if (missing.length > 0) {
        gaps.push(`plural \`${element.value}\` lacks ${missing.join(", ")}`);
      }
    }
    if (element.type === TYPE.tag) {
      gaps.push(...pluralGaps(element.children, categories));
    }
    if (element.type === TYPE.plural || element.type === TYPE.select) {
      for (const option of Object.values(element.options)) {
        gaps.push(...pluralGaps(option.value, categories));
      }
    }
  }
  return gaps;
}

function same(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((name) => b.has(name));
}

/**
 * The missing-key gate (`pnpm i18n:check`): every key in every locale, valid
 * ICU, the same arguments as the reference, complete plurals, no empties.
 */
export function checkCatalogs(
  catalogs: Catalogs,
  reference: string,
): Finding[] {
  const findings: Finding[] = [];
  const flat = new Map<string, Map<string, unknown>>();
  for (const [locale, catalog] of Object.entries(catalogs)) {
    const entries = new Map<string, unknown>();
    flatten(catalog, "", entries);
    flat.set(locale, entries);
  }

  const allKeys = new Set([...flat.values()].flatMap((m) => [...m.keys()]));
  const parsed = new Map<string, Map<string, MessageFormatElement[]>>();

  for (const [locale, entries] of flat) {
    const categories = new Intl.PluralRules(locale).resolvedOptions()
      .pluralCategories as string[];
    const ok = new Map<string, MessageFormatElement[]>();
    parsed.set(locale, ok);

    for (const key of [...allKeys].sort()) {
      if (!entries.has(key)) {
        findings.push({ locale, key, message: "missing" });
        continue;
      }
      const value = entries.get(key);
      if (typeof value !== "string") {
        findings.push({ locale, key, message: "not a string" });
        continue;
      }
      if (value.trim() === "") {
        findings.push({ locale, key, message: "empty" });
        continue;
      }
      let elements: MessageFormatElement[];
      try {
        elements = parse(value);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        findings.push({ locale, key, message: `invalid ICU (${reason})` });
        continue;
      }
      ok.set(key, elements);
      for (const gap of pluralGaps(elements, categories)) {
        findings.push({ locale, key, message: gap });
      }
    }
  }

  const base = parsed.get(reference) ?? new Map();
  for (const [locale, messages] of parsed) {
    if (locale === reference) continue;
    for (const [key, elements] of messages) {
      const expected = base.get(key);
      if (!expected) continue;
      const want = new Set<string>();
      const got = new Set<string>();
      argumentsOf(expected, want);
      argumentsOf(elements, got);
      if (!same(want, got)) {
        const list = (s: Set<string>) => [...s].sort().join(", ") || "none";
        findings.push({
          locale,
          key,
          message: `arguments ${list(got)} differ from ${reference} (${list(want)})`,
        });
      }
    }
  }

  return findings;
}
