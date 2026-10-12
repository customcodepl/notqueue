// Layer boundaries from CLAUDE.md:
// core → application → infra → api / app. i18n is presentation-side.
// Paths are relative to the working directory, so the same rules also run
// against tools/depcruise-fixtures (see its test).

// Matches both plain and pnpm (.pnpm/<pkg>@<ver>/node_modules/<pkg>/) paths.
const FRAMEWORK_AND_IO_PACKAGES =
  "node_modules/(next|react|react-dom|drizzle-orm|hono|@supabase/[a-z-]+)/";

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
      name: "infra-imports-outer-layer",
      comment: "infra may import only core and application.",
      severity: "error",
      from: { path: "^src/infra/" },
      to: { path: "^src/(api|app|i18n)/" },
    },
    {
      name: "presentation-imports-infra",
      comment:
        "api and app may import only application and core (plus i18n). Composition-root access to infra is decided in F-FOUND-API.",
      severity: "error",
      from: { path: "^src/(api|app)/" },
      to: { path: "^src/infra/" },
    },
    {
      name: "i18n-imports-non-core",
      comment: "i18n is presentation-side and may import only core.",
      severity: "error",
      from: { path: "^src/i18n/" },
      to: { path: "^src/(application|infra|api|app)/" },
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
