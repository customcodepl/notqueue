# docs-check

Documentation checks ([ADR-0021](../../docs/adr/0021-documentation-review-by-a-reviewer-agent.md)). TypeScript run with `tsx`, no dependencies; unit tests in the Vitest `unit` project.

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
A hint for the docs reviewer, not a gate: every doc that `docs/doc-map.json` maps to the branch's changes (against `origin/main`, plus uncommitted and new files), with all the changed files that require it and whether the doc itself changed. Tests, Markdown, e2e, fixtures and the lockfile never trigger it.

- `--hook`: the Claude Code `PreToolUse` hook in `.claude/settings.json` ([ADR-0021](../../docs/adr/0021-documentation-review-by-a-reviewer-agent.md)). The first `gh pr create` for a branch state (HEAD) is denied and asks for the docs-reviewer agent (see "Docs reviewer" below), with this list as a hint; it is denied even when nothing is mapped, because docs also depend on other docs. The retry for the same HEAD goes through. A later HEAD goes through too if everything changed since the reviewed HEAD is Markdown (the review's own fixes) and the reviewed HEAD is its ancestor; any other new commit asks again. Only a command that starts with it (or follows `;`, `&&`, `||` or `|`) counts; text inside a heredoc can still match, which only costs a review. A command that also commits, merges, reverts, rebases, pulls or cherry-picks before it is always denied: the hook runs before the whole command, so it would review the branch without those commits. The last reviewed HEAD is kept in `.git/docs-review` (per clone, never committed). Decision logic: `pr-hook.ts`.

## Changing the rules
- A new doc that describes a folder: add the glob and the doc to `docs/doc-map.json`.
- A new living doc: add it to `LIVING_DOCS` in `checks/paths.ts`.
- A new `src/` layer: add it to `LAYERS` in `checks/layer-readmes.ts`.

## Docs reviewer
`.claude/agents/docs-reviewer.md` is the read-only agent that the `gh pr create` hook asks for ([ADR-0021](../../docs/adr/0021-documentation-review-by-a-reviewer-agent.md)). Its model is pinned by full ID. Changing the model or the prompt means rerunning the replay below and recording the result here.

**Replay.** Run the agent on the merged PRs below, each in a detached worktree at its merge commit, with the previous `main` commit as the base. Paste the agent's instructions into the prompt instead of pointing at this checkout: the checkout's newer commits and plans give the answers away. The run passes when every expected finding is reported, and the docs-only PR gets no false finding (true findings are fine).

| PR | Expected findings |
|---|---|
| #16 | The README `pnpm check` comment doesn't list `i18n:check` |
| #17 | `VERCEL_AUTOMATION_BYPASS_SECRET` is missing from the secrets table; the Stage 0 scope in ROADMAP doesn't name the new feature |
| #24 | The README status line still says Stage 0 is in progress |
| #25 | None (docs-only) |

**Last result (2026-11-12): `claude-opus-5-5` pinned.**
- `claude-opus-5-5` passed all four runs. It also found true issues outside the list: `src/i18n/README.md` still placing `LocalizedText` there, the CLAUDE.md "Time" rule naming next-intl formatters instead of `src/i18n/format.ts`, and the Vercel Pro timing for Cron.
- `claude-sonnet-5-5` reported every expected finding. Twice it read the newer checkout despite an explicit rule not to, so its #17 result doesn't count.
