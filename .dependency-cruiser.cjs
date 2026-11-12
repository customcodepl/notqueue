// Layer boundaries from CLAUDE.md:
// core → application → infra → api / app. i18n is presentation-side.
// src/server/ is the composition root that wires them together (ADR-0015).
// Paths are relative to the working directory, so the same rules also run
// against tools/depcruise-fixtures (see its test).

// Matches both plain and pnpm (.pnpm/<pkg>@<ver>/node_modules/<pkg>/) paths.
const FRAMEWORK_AND_IO_PACKAGES =
  "node_modules/(next|react|react-dom|drizzle-orm|pg|@types/pg|@vercel/functions|hono|@hono/[a-z-]+|@supabase/[a-z-]+)/";

// The HTTP framework: only api (and the composition root) use it.
const HTTP_PACKAGES = "node_modules/(hono|@hono/[a-z-]+)/";

// Database and Supabase clients: only infra talks to them (ADR-0013).
const DB_PACKAGES =
  "node_modules/(drizzle-orm|pg|@types/pg|@supabase/[a-z-]+)/";

/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "core-imports-other-layer",
      comment: "core is the pure domain: it imports nothing from other layers.",
      severity: "error",
      from: { path: "^src/core/" },
      to: { path: "^src/(application|infra|api|app|i18n)/" },
    },
    {
      name: "core-imports-framework-or-io",
      comment: "core stays framework-free and I/O-free.",
      severity: "error",
      from: { path: "^src/core/" },
      to: { path: FRAMEWORK_AND_IO_PACKAGES },
    },
    {
      name: "application-imports-outer-layer",
      comment: "application may import only core.",
      severity: "error",
      from: { path: "^src/application/" },
      to: { path: "^src/(infra|api|app|i18n)/" },
    },
    {
      name: "application-imports-db-client",
      comment:
        "application depends on ports; database and Supabase clients live in infra.",
      severity: "error",
      from: { path: "^src/application/" },
      to: { path: DB_PACKAGES },
    },
    {
      name: "application-or-infra-imports-hono",
      comment:
        "HTTP stays in api: use cases and adapters don't know about Hono.",
      severity: "error",
      from: { path: "^src/(application|infra)/" },
      to: { path: HTTP_PACKAGES },
    },
    {
      name: "infra-imports-outer-layer",
      comment: "infra may import only core and application.",
      severity: "error",
      from: { path: "^src/infra/" },
      to: { path: "^src/(api|app|i18n)/" },
    },
    {
      name: "presentation-imports-infra",
      comment:
        "api and app may import only application and core (plus i18n). infra is wired in by the composition root in src/server/ (ADR-0015).",
      severity: "error",
      from: { path: "^src/(api|app)/" },
      to: { path: "^src/infra/" },
    },
    {
      name: "server-imported-outside-entry-points",
      comment:
        "The composition root (ADR-0015) may import every layer; only Next.js entry points in src/app/ and src/instrumentation.ts import it.",
      severity: "error",
      from: { pathNot: "^src/(app/|server/|instrumentation\\.ts$)" },
      to: { path: "^src/server/" },
    },
    {
      name: "i18n-imports-non-core",
      comment: "i18n is presentation-side and may import only core.",
      severity: "error",
      from: { path: "^src/i18n/" },
      to: { path: "^src/(application|infra|api|app)/" },
    },
    {
      name: "raw-transaction-outside-scoped-helpers",
      comment:
        "Database access goes through withTenantTransaction or withPlatformTransaction (ADR-0022); the raw withTransaction is for them and for tests. Importing the Tx type is fine.",
      severity: "error",
      from: {
        pathNot:
          "^src/infra/db/((tenant|platform)-transaction\\.ts$|testing/)|\\.int\\.test\\.ts$",
      },
      to: {
        path: "^src/infra/db/transaction\\.ts$",
        dependencyTypesNot: ["type-only"],
      },
    },
    {
      name: "platform-transaction-outside-its-unit-of-work",
      comment:
        "Cross-tenant access only through PlatformUnitOfWork (ADR-0022); tests may use the helper directly.",
      severity: "error",
      from: {
        pathNot:
          "^src/infra/db/(unit-of-work\\.ts$|testing/)|\\.int\\.test\\.ts$",
      },
      to: { path: "^src/infra/db/platform-transaction\\.ts$" },
    },
    {
      name: "platform-port-outside-platform-module",
      comment:
        "Cross-tenant queries only in the platform module (src/application/platform/), wired by the composition root (ADR-0005, ADR-0022).",
      severity: "error",
      from: {
        pathNot:
          "^src/(application/platform/|server/|infra/db/unit-of-work\\.ts$)",
      },
      to: { path: "^src/application/ports/platform-unit-of-work\\.ts$" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(^|/)(\\.next|coverage|playwright-report|test-results)/",
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
  },
};
