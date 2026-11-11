# F-FOUND-DOCS: Documentation checks

- **Stage:** 0 (Foundations)
- **Status:** done (2026-11-11); plan approved 2026-11-11
- **Depends on:** F-FOUND-REPO (done), F-FOUND-PIPELINE (done)
- **Unblocks:** none directly; every later feature is checked by it
- **ADRs:** [ADR-0001](../../adr/0001-record-architecture-decisions.md); [ADR-0016](../../adr/0016-documentation-checks-per-pull-request.md) (decision 1)

## Goal
A PR can't merge while the docs it should have updated are stale: CI fails on broken links and paths, on commands, ADR index or progress counts that don't match the repo, on layer READMEs that miss a folder, and on code changes whose mapped docs weren't touched unless the PR states why they need no change.

Background: after F-FOUND-API, three docs had fallen behind (the composition root in CLAUDE.md and README, new folders in `src/infra/README.md`; fixed in #10), and the uptime monitor that F-FOUND-PIPELINE recorded as done had never been set up. Nothing in CI noticed.

## Scope
- **`tools/docs-check/`** (TypeScript, run with `tsx`, unit-tested in the Vitest `unit` project, no new dependencies):
  - a small Markdown reader: headings with GitHub anchor slugs, links and inline code outside code fences;
  - one module per check below, a CLI that prints `file:line: message` per finding and exits non-zero.
- **`pnpm docs:check`** (part of `pnpm check` and the CI "Checks" job). Mechanical checks over all tracked `*.md` files except `tools/depcruise-fixtures/`:
  1. **Links:** relative links point to existing files; `#anchors` match a heading of the target (or the same) file. External URLs aren't fetched.
  2. **Paths:** backticked repo paths (starting with `src/`, `docs/`, `tools/`, `e2e/`, `supabase/`, `.github/`) exist. Applies to living docs only (decision 2): `README.md`, `CLAUDE.md`, `src/**/README.md`, `tools/**/README.md`, `docs/ROADMAP.md`, `docs/FEATURES.md`, `docs/DESIGN.md`, `docs/demos/*.md`. Placeholders (`<…>`, `NNNN`), globs and `...` are skipped.
  3. **Commands:** every `pnpm <script>` in CLAUDE.md "Commands" exists in `package.json`, and every script is mentioned there (allowlist: `start`, `prepare`).
  4. **ADR index:** every `docs/adr/NNNN-*.md` has one row in `docs/adr/README.md`, with the same title and status as the file.
  5. **Progress:** the counts in FEATURES.md "Progress" (per stage and total) and "Total: N features" match the status column of the feature tables; `dropped` features leave the count.
  6. **Layer READMEs:** every folder directly under `src/<layer>/` (`core`, `application`, `infra`, `api`, `server`, `i18n`) is named as `` `folder/` `` in that layer's README. `src/app/` is exempt: its folders are routes.
- **Doc map** (decision 3): `docs/doc-map.json` maps code globs to the docs that describe them, e.g.:
  ```json
  {
    "src/infra/**": ["src/infra/README.md"],
    "src/api/**": ["src/api/README.md"],
    "src/server/**": ["src/server/README.md"],
    ".github/workflows/**": ["README.md"],
    "package.json": ["CLAUDE.md"],
    "supabase/**": ["CLAUDE.md", "README.md"]
  }
  ```
  - `pnpm docs:map [--base <ref>]` lists the changed files (against `origin/main` by default) that match a glob, and the mapped docs that the change didn't touch. Tests (`*.test.ts`, `*.int.test.ts`, `e2e/**`), fixtures and `pnpm-lock.yaml` never trigger it.
  - A mapped doc counts as handled when the PR changes it, or when the PR description has a line `Docs-unchanged: <doc> — <reason>` (decision 4). The reason is required.
- **CI** (decision 5):
  - "Checks" runs `pnpm docs:check`.
  - A new workflow `pr-docs.yml` (job "Docs map") runs `pnpm docs:map` on `pull_request` (`opened`, `edited`, `synchronize`, `reopened`), so editing the PR description re-runs it. The description is passed through `env`, never interpolated into the script.
  - "Docs map" becomes a required check in the `main` ruleset (a setting, recorded in the PR).
  - `.github/pull_request_template.md` with a short "Docs" section that shows the `Docs-unchanged:` format.
- **Claude Code hook** (decision 6): a committed `.claude/settings.json` with a `PreToolUse` hook on `git commit` that runs `pnpm docs:map --staged` and shows the mapped docs that the staged change doesn't touch. It reminds; it doesn't block (the commit may be a plan step before the docs step).
- **Rules:**
  - ROADMAP baseline definition of done, "Every feature → Quality": `pnpm docs:check` passes and the doc map is satisfied or declared unchanged.
  - CLAUDE.md: workflow rule 5 (close-out) names both checks; "Commands" lists `docs:check` and `docs:map`.
- **Stage 0 demo:** a new section after the API steps: a PR that changes `src/infra/` without its README fails "Docs map", and passes after a `Docs-unchanged:` line is added to the description.
- **First run:** existing findings are fixed in the same steps (the README gaps in `api`, `application` and `core`, a future plan path in FEATURES.md).

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Checking external URLs (network, flaky) | Not planned |
| Section-level doc map (`README.md#cicd`) | Later, if file-level proves too coarse (decision 3) |
| Spell or style checks of prose | Not planned |
| Checking i18n catalogs | F-FOUND-I18N (missing-key gate) |
| OpenAPI snapshot drift | Already covered by the F-FOUND-API snapshot test |

## Affected modules
- **Repo tooling:** `tools/docs-check/` (new), `docs/doc-map.json` (new), `package.json` scripts, `vitest.config.mts` only if the `tools/**` include needs a change.
- **CI:** `.github/workflows/ci.yml` (Checks), `.github/workflows/pr-docs.yml` (new), `.github/pull_request_template.md` (new).
- **Claude Code:** `.claude/settings.json` (new, committed).
- **Docs:** CLAUDE.md, README (Development and CI/CD), Stage 0 demo, ROADMAP (Stage 0 scope, baseline definition of done), FEATURES.md, `src/api`, `src/application` and `src/core` READMEs (first-run fixes), `tools/docs-check/README.md`.
- No application layers change.

## Data model and API changes
None. Tooling only.

## Conventions
- **Docs in English;** check messages in English.
- **No secrets or PII:** the PR description is read from `env` in CI and only parsed for `Docs-unchanged:` lines.
- **Layers:** `tools/` stays outside `src/`; dependency-cruiser doesn't cruise it.
- Other conventions (tenant isolation, i18n, time, UI) don't apply: no runtime code.

## UI screens
None. This feature has no UI.

## Test plan
- **Unit (Vitest, fixtures as in-memory strings or a temp folder):**
  - Markdown reader: headings and slugs (backticks, punctuation, duplicates get `-1`), links and inline code inside fences are ignored.
  - Each check: one passing and one failing case per rule (missing file, missing anchor, missing path, unknown and unlisted script, ADR row missing or with a different status, wrong stage count, folder missing from a README).
  - Doc map: glob matching, test files ignored, a touched doc satisfies it, `Docs-unchanged:` with and without a reason, an unknown doc in `Docs-unchanged:`.
- **Repo:** `pnpm docs:check` passes on the repo after the first-run fixes.
- **CI (manual, on this PR):** "Docs map" fails when a mapped doc is missing and passes after adding a `Docs-unchanged:` line to the description, without a new push.
- **Hook (manual):** a `git commit` by Claude Code shows the reminder for a staged `src/infra` change.

## Implementation steps
1. `build(docs): add markdown link and path checks`: reader, links and paths checks, `docs:check` script, first-run fixes.
2. `build(docs): check commands, adr index and progress`: checks 3–5.
3. `build(docs): require layer readmes to list their folders`: check 6 and the README fixes.
4. `build(docs): add doc map check`: `docs/doc-map.json`, `docs:map` (`--base`, `--staged`, PR description from env).
5. `ci(docs): run docs checks on pull requests`: Checks job, `pr-docs.yml`, PR template; ruleset (setting).
6. `chore(claude): remind about mapped docs before commits`: `.claude/settings.json` hook.
7. `docs: document the docs checks`: CLAUDE.md, README, ROADMAP, FEATURES, Stage 0 demo, `tools/docs-check/README.md`, ADR link, Deviations.

## Done when
- `pnpm docs:check` and `pnpm docs:map` run locally and in CI; "Docs map" is a required check.
- On this PR, "Docs map" demonstrably fails without the mapped docs and passes with them or with `Docs-unchanged:`.
- Baseline: lint, typecheck and unit tests pass in CI; no endpoints (no isolation tests); no UI strings.
- FEATURES.md updated (status, Progress, Next up → F-FOUND-I18N).

## Risks and open questions
- **False positives** make people (and me) write `Docs-unchanged:` by reflex. Mitigation: tests never trigger the map, globs start coarse only where a doc really describes the folder, and the map is tuned in later PRs like any other config.
- **GitHub's slug rules** have edge cases (emoji, non-ASCII). Docs are English and the tests cover the headings in use; a mismatch shows up as a finding, not as silent acceptance.
- **The hook runs on every `git commit`** Claude Code makes; `docs:map --staged` must stay fast (a `git diff --cached --name-only` and a glob match).
- **Stage 0 grows to 6 features** and F-FOUND-I18N moves back by one feature.
- No ROADMAP open question blocks this feature.

## Decisions (approved 2026-11-11)
All recommendations accepted as proposed. Decision 1 is recorded in [ADR-0016](../../adr/0016-documentation-checks-per-pull-request.md).

1. **Enforcement model (ADR):** recommended: per PR in CI, combining mechanical checks, layer README completeness and a doc map with an explicit `Docs-unchanged:` opt-out; no per-commit gate and no manual "current / in progress" status in docs. Alternatives: a pre-commit hook that requires a doc change in every commit (plan steps would get artificial doc edits, and `--no-verify` bypasses it); a status header per doc (it goes stale the same way the content does).
2. **Path check scope:** recommended: living docs only. Plans and ADRs are historical records (ADRs may only change status and links), and they name files that were planned, renamed or rejected; they get the link check only. Alternative: every doc, with ignore markers (noise in records nobody should edit).
3. **Doc map granularity:** recommended: whole files. Section-level (`README.md#cicd`) needs mapping diff hunks to headings, which is more code for a gain that the mechanical checks partly cover. Alternative: section-level from the start.
4. **Opt-out form:** recommended: `Docs-unchanged: <doc> — <reason>` lines in the PR description, per doc and with a reason, re-checked when the description is edited. Alternative: a `docs-unchanged` label (one click, but no reason and not per doc).
5. **Where the map check runs:** recommended: a separate workflow `pr-docs.yml`, because it must re-run on description edits without re-running the whole CI; it's required in the ruleset. Alternative: a job in `ci.yml` (that workflow doesn't trigger on `edited`).
6. **Claude Code hook:** recommended: a committed `.claude/settings.json` with a non-blocking reminder before `git commit`, since most commits here are made by Claude Code. Alternative: no hook (rely on CI only) or a local-only hook in `settings.local.json`.
7. **Feature placement:** recommended: F-FOUND-DOCS in Stage 0 before F-FOUND-I18N, so i18n and every later feature are checked; the ROADMAP baseline definition of done gains the two checks. Alternative: a chore outside the feature list (no plan, no Progress entry).

## Deviations
Resolved during implementation (2026-11-11).

1. **No `package.json` entry in the doc map.** Every dependency bump would require a CLAUDE.md change or an opt-out; scripts are covered mechanically by the commands check instead.
2. **The map also covers** `.github/scripts/**`, `.github/actions/**`, `next.config.ts`, `vercel.json` (→ README), `.dependency-cruiser.cjs` (→ CLAUDE.md) and `tools/docs-check/**` (→ its README). `src/app/` isn't mapped: its README is general, and UI changes would mostly produce opt-outs.
3. **`docs:check` validates the map itself** (docs exist, globs match a file), so a moved folder can't leave the map silently stale. Not in the plan.
4. **The hook checks the whole branch, not `--staged`.** Claude Code usually runs `git add … && git commit` as one command, and the `PreToolUse` hook runs before it, when nothing is staged yet. A new `--hook` mode reads the command from stdin, reacts only to `git commit` and returns `additionalContext`; `--staged` stays for manual use. A shell pre-filter keeps other Bash calls from starting `pnpm`.
5. **`Docs-unchanged:` lines inside HTML comments are ignored,** so the hint in the new PR template doesn't count as an opt-out (it would have failed every PR).
6. **First-run findings fixed:** a future plan path in FEATURES.md, `test:watch` missing from CLAUDE.md "Commands" (an old gap), and the folders of the `core`, `application` and `api` READMEs.
7. **Stage 0 demo:** steps 15–16; the i18n step is now 17.
8. **`.prettierignore`:** only the comment on `.claude/` changed; the committed `settings.json` stays hand-formatted.
9. **"Docs map" as a required check** is a ruleset setting, applied after the first run on this PR.
