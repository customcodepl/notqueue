# docs-check

Documentation checks ([ADR-0017](../../docs/adr/0017-documentation-review-before-opening-a-pull-request.md)). TypeScript run with `tsx`, no dependencies; unit tests in the Vitest `unit` project.

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
| `checks/secrets.ts` | Every `secrets.X` and `vars.X` in `.github/workflows/` and every variable in `.env.example` is named in the README's "Secrets and variables" section (`GITHUB_TOKEN` is exempt). Names only, never values. |
| `doc-map.ts` (`checkDocMap`) | Every doc in `docs/doc-map.json` exists and every glob matches a file. |

## `pnpm docs:map`
A review aid, not a gate: every doc that `docs/doc-map.json` maps to the branch's changes (against `origin/main`, plus uncommitted and new files), with all the changed files that require it and whether the doc itself changed. Tests, Markdown, e2e, fixtures and the lockfile never trigger it.

- `--hook`: the Claude Code `PreToolUse` hook in `.claude/settings.json`. The first `gh pr create` for a branch state (HEAD) is denied with the full list; the retry for the same HEAD goes through, and a new commit asks again. Only a command that starts with it (or follows `;`, `&&`, `||` or `|`) counts, not the text inside another command. A command that also commits, merges, reverts, rebases, pulls or cherry-picks before it is always denied: the hook runs before the whole command, so it would review the branch without those commits. The last reviewed HEAD is kept in `.git/docs-review` (per clone, never committed). Decision logic: `pr-hook.ts`.

## Changing the rules
- A new doc that describes a folder: add the glob and the doc to `docs/doc-map.json`.
- A new living doc: add it to `LIVING_DOCS` in `checks/paths.ts`.
- A new `src/` layer: add it to `LAYERS` in `checks/layer-readmes.ts`.
