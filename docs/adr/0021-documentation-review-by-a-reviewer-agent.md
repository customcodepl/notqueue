# ADR-0021: Documentation review by a reviewer agent

- **Status:** accepted
- **Date:** 2026-11-12
- **Related:** supersedes [ADR-0017](0017-documentation-review-before-opening-a-pull-request.md); F-FOUND-DOCS-REVIEWER, F-FOUND-DOCS, every feature (baseline definition of done)

## Context
[ADR-0017](0017-documentation-review-before-opening-a-pull-request.md) has Claude Code review the docs that `docs/doc-map.json` assigns to the changed files, right before `gh pr create`. After Stage 0, four docs were stale although `docs:check` was green and that review had run: the README status line and `pnpm check` comment, the Stage 0 scope in ROADMAP, and the secrets table. None is reachable from a code → doc map: they depend on other docs or on settings. The review was also done by the author of the change, who shares its blind spots, so the product owner kept asking before each PR whether the docs were current.

## Decision
Before every PR that Claude Code opens, the `gh pr create` hook asks for a read-only `docs-reviewer` subagent. It compares the branch's diff and commits with a fixed list of living docs (README, CLAUDE.md, ROADMAP, FEATURES, the feature's plan, the stage demo, layer and tool READMEs, the ADRs the change touches) and reports each stale statement. Claude Code fixes each finding or answers it in the PR's "Docs" section. The doc map stays as a hint. The agent's model is pinned by full ID and changed only together with a rerun of its replay test. `pnpm docs:check` stays the deterministic gate in CI.

## Alternatives considered
- **Keep ADR-0017's doc-map review:** misses doc → doc and settings dependencies, which caused all four misses.
- **More mechanical rules plus a close-out checklist in the hook:** deterministic, but every new kind of dependency needs a new rule, and a checklist shown on every PR turns into noise.
- **The reviewer in GitHub Actions on every PR (`claude-code-action`):** also covers PRs opened by hand, but needs an API key in a public repository and costs per push.
- **`inherit` or an alias for the model:** review quality would change with the session's model or silently with new releases, so the replay test would stop meaning anything.

## Consequences
- **Positive:** semantic staleness across docs is caught without maintaining rules; the review comes from a fresh context; the product owner doesn't have to ask.
- **Negative / accepted trade-offs:** the review is not deterministic and can miss or misreport, so it is never a required check; one extra agent run per PR; PRs opened outside Claude Code get `docs:check` only.
- **Follow-ups:** the replay on known stale PRs is rerun whenever the agent's prompt or model changes; CLAUDE.md, ROADMAP, README, the PR template and the Stage 0 demo follow this ADR.
