# docs-check

Documentation checks ([ADR-0016](../../docs/adr/0016-documentation-checks-per-pull-request.md)). TypeScript run with `tsx`, no dependencies; unit tests in the Vitest `unit` project.

## `pnpm docs:check`
Part of `pnpm check` and of the CI "Checks" job. Prints `file:line: message` per finding and fails if there are any.

| Check | Rule |
|---|---|
| `checks/links.ts` | Relative links point to existing files; `#anchors` match a heading (GitHub slugs). External URLs aren't fetched. |
| `checks/paths.ts` | Backticked repo paths exist, in living docs only (`LIVING_DOCS`); plans and ADRs record history. Placeholders and globs are skipped. |
| `checks/commands.ts` | CLAUDE.md "Commands" and `package.json` scripts list the same commands (`start` and `prepare` are exempt). |
| `checks/adr-index.ts` | Every ADR file has one row in `docs/adr/README.md` with the same title and status. |
| `checks/progress.ts` | FEATURES.md "Progress" and "Total" match the feature tables; `dropped` features don't count. |
| `checks/layer-readmes.ts` | Every folder directly under a `src/` layer is named as `` `folder/` `` in that layer's README (`src/app/` is exempt). |
| `doc-map.ts` (`checkDocMap`) | Every doc in `docs/doc-map.json` exists and every glob matches a file. |

## `pnpm docs:map`
The docs that `docs/doc-map.json` maps to changed code and that the change didn't touch. Tests, Markdown, e2e, fixtures and the lockfile never trigger it.

- No flag: the branch against `origin/main`, plus uncommitted and new files. Fails if a doc is missing.
- `--base <ref>`: the "Docs map" job in `.github/workflows/pr-docs.yml`. Reads `Docs-unchanged: <doc> — <reason>` lines from the PR description (`PR_BODY`); HTML comments are skipped.
- `--staged`: staged files only; a reminder that never fails.
- `--hook`: the Claude Code `PreToolUse` hook in `.claude/settings.json`. Before a `git commit` it tells Claude which mapped docs the branch hasn't updated; it never blocks.

## Changing the rules
- A new doc that describes a folder: add the glob and the doc to `docs/doc-map.json`.
- A new living doc: add it to `LIVING_DOCS` in `checks/paths.ts`.
- A new `src/` layer: add it to `LAYERS` in `checks/layer-readmes.ts`.
