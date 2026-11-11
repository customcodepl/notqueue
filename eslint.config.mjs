import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Type-aware rules for async code: an unawaited promise can drop an
    // error or commit a transaction too early.
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    // Dates and times are displayed only through src/i18n/format.ts, which
    // requires the venue's timezone (CLAUDE.md "Time").
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/i18n/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next-intl",
              importNames: ["useFormatter", "createFormatter", "useNow"],
              message: "Format dates and times with src/i18n/format.ts.",
            },
            {
              name: "next-intl/server",
              importNames: ["getFormatter", "getNow"],
              message: "Format dates and times with src/i18n/format.ts.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "NewExpression[callee.object.name='Intl'][callee.property.name=/^(DateTimeFormat|RelativeTimeFormat)$/]",
          message: "Format dates and times with src/i18n/format.ts.",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
          message: "Format dates and times with src/i18n/format.ts.",
        },
      ],
    },
  },
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
