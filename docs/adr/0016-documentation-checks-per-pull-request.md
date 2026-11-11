# ADR-0016: Documentation checks per pull request

- **Status:** superseded by [ADR-0017](0017-documentation-review-before-opening-a-pull-request.md)
- **Date:** 2026-11-11
- **Related:** [ADR-0001](0001-record-architecture-decisions.md), F-FOUND-DOCS, every feature (baseline definition of done)

## Context
The docs are the working memory of this project: CLAUDE.md, README, ROADMAP, FEATURES, the layer READMEs and the plans steer every session. They fall behind silently. After F-FOUND-API, CLAUDE.md, README and `src/infra/README.md` missed the composition root and new folders, and an uptime monitor recorded as done in F-FOUND-PIPELINE had never been set up. Commits follow plan steps, and docs are usually the last step of a feature, so a rule per commit doesn't fit; each PR is squashed into one commit on `main`.

## Decision
Documentation freshness is enforced per pull request in CI, at three levels:
- mechanical checks (`pnpm docs:check`: links and anchors, paths in living docs, commands, ADR index, progress counts);
- layer READMEs that must name every folder of their layer;
- a doc map (`docs/doc-map.json`): when a PR changes mapped code, it must change the mapped docs or declare each one unchanged with a reason (`Docs-unchanged: <doc> — <reason>` in the PR description).

Both checks are part of the baseline definition of done. A Claude Code hook reminds about mapped docs before commits but doesn't block them.

## Alternatives considered
- **A pre-commit gate that requires a doc change in every commit:** plan steps would get artificial doc edits, and `--no-verify` bypasses it anyway.
- **A manual status per doc ("current" / "in progress"):** the status goes stale the same way the content does; feature status already lives in FEATURES.md.
- **Review discipline only:** that is what missed the gaps above.
- **A PR label instead of `Docs-unchanged:` lines:** one click, but no reason and not per doc.

## Consequences
- **Positive:** broken links, renamed paths, unlisted scripts and wrong counts fail CI; skipping a doc update becomes an explicit, reviewed statement.
- **Negative / accepted trade-offs:** the doc map needs tuning to avoid reflexive opt-outs; GitHub anchor slugs are reimplemented and may miss edge cases; plans and ADRs get link checks only, since they record history.
- **Follow-ups:** F-FOUND-DOCS builds the checks; "Docs map" becomes a required check in the `main` ruleset; new folders and docs are added to the map and READMEs as they appear.
