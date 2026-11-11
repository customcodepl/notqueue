# ADR-0017: Documentation review before opening a pull request

- **Status:** accepted
- **Date:** 2026-11-11
- **Related:** supersedes [ADR-0016](0016-documentation-checks-per-pull-request.md); F-FOUND-DOCS, every feature (baseline definition of done)

## Context
[ADR-0016](0016-documentation-checks-per-pull-request.md) enforced the doc map in CI: a PR failed unless every mapped doc changed or was declared unchanged in the description. In use, the check proved coarse: it passes as soon as a doc changes at all, so a README updated for one file also covers every other changed file, and it would have failed every Dependabot PR that bumps a workflow action. Almost every PR in this project is prepared and opened by Claude Code, which can review the docs at the moment that matters: right before the PR exists.

## Decision
The doc map is a review aid for Claude Code, not a CI gate:
- before `gh pr create`, a Claude Code hook blocks the first attempt for each branch state and lists every mapped doc with all the changed files that require it;
- Claude Code checks each listed file against its doc, updates the docs or decides they're current, and says so in the PR's "Docs" section; the retry for the same branch state goes through.

`pnpm docs:check` (links, paths, commands, ADR index, progress, layer READMEs, the map itself) stays in CI, because it checks facts and covers changes made outside Claude Code.

## Alternatives considered
- **Keep the "Docs map" CI job (ADR-0016):** coarse per-doc matching gives false assurance, and opt-out lines add friction (Dependabot).
- **A reminder at every `git commit`:** fires on every plan step until the docs step, so it turns into noise; it also arrives after the command has run.
- **A rule in CLAUDE.md only:** nothing makes the review happen at the right moment.

## Consequences
- **Positive:** the review happens per changed file, at the moment the PR is opened; no opt-out lines, no Dependabot friction; the PR description records what was checked.
- **Negative / accepted trade-offs:** a PR opened outside Claude Code gets no doc-map review, only `docs:check`; the review's quality isn't verified mechanically.
- **Follow-ups:** remove `pr-docs.yml` and the "Docs map" required check; change the hook from `git commit` to `gh pr create`; update CLAUDE.md, ROADMAP, README, the PR template and the Stage 0 demo.
