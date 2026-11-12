# F-FOUND-DOCS-REVIEWER: Documentation reviewer agent

- **Stage:** 0 (Foundations)
- **Status:** done (2026-11-12); plan approved 2026-11-12
- **Depends on:** F-FOUND-DOCS
- **Unblocks:** none directly; every later PR is reviewed by it
- **ADRs:** [ADR-0017](../../adr/0017-documentation-review-before-opening-a-pull-request.md) (superseded by [ADR-0021](../../adr/0021-documentation-review-by-a-reviewer-agent.md), decision 2)

## Goal
Before every PR that Claude Code opens, a separate read-only agent compares the branch's changes with the living docs and reports each doc that has gone stale, so you no longer have to ask whether the docs are current.

Background: after Stage 0, four docs were stale although `docs:check` was green and the doc-map review had run:
- the README status line;
- the `pnpm check` comment in the README;
- the Stage 0 scope in ROADMAP;
- the secrets table, which was missing `VERCEL_AUTOMATION_BYPASS_SECRET`.

None of them is reachable from the code → doc map: they depend on other docs or on settings, and the author reviewed their own work.

## Scope
- **Subagent** `.claude/agents/docs-reviewer.md`:
  - Read-only tools: `Read`, `Grep`, `Glob`, and `Bash` for `git diff`/`git log` only.
  - Model pinned by full ID (decision 5); changing it means rerunning the replay.
  - Input: the branch name and the feature ID, if any.
  - Reads the diff against `origin/main` and the commit messages, then checks a fixed list of living docs:
    - `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`, `docs/FEATURES.md`;
    - the feature's plan (status, deviations), the stage's demo script;
    - the layer and tool READMEs;
    - the ADRs that the diff touches or that cover the changed area.
  - `docs/doc-map.json` is a hint for where to look first, not the limit.
  - Output: one finding per stale statement (`file:line`, what is stale, what the diff says instead), or "No findings" with the docs it checked.
  - It never edits files.
- **Hook** (the existing `PreToolUse` hook on `gh pr create`, `tools/docs-check/pr-hook.ts`):
  - The first attempt per HEAD is still denied, now with: "Run the docs-reviewer agent on this branch; fix each finding or say in the PR's Docs section why it needs no change", plus the doc-map list as a hint.
  - A follow-up commit that only changes Markdown files after a review doesn't trigger a new review (decision 4).
  - The chained-commit rule from #23 stays.
- **Fewer duplicates** (less to keep current):
  - The README status line only links to FEATURES "Progress".
  - The README `pnpm check` comment points to CLAUDE.md "Commands" instead of listing the checks.
  - The secrets table moves from the F-FOUND-PIPELINE plan to a README section "Secrets and variables". The plan keeps a one-line pointer.
- **One new mechanical rule in `docs:check`:** every `secrets.X` and `vars.X` used in `.github/workflows/**`, and every variable in `.env.example`, has a row in the README secrets table. `GITHUB_TOKEN` is exempt.
- **Rules and docs:**
  - CLAUDE.md rule 5 (close-out);
  - the ROADMAP definition of done ("Docs are current");
  - the README CI paragraph;
  - `tools/docs-check/README.md` (`--hook`);
  - the PR template's "Docs" comment;
  - Stage 0 demo step 15 (now: the hook asks for the reviewer, the reviewer reports, the retry opens the PR).

## Out of scope
| Item | Feature that delivers it |
|---|---|
| The reviewer in GitHub Actions on every PR (`claude-code-action`) | Not planned: an API key in a public repository, cost per push, no gain over the hook (decision 3) |
| A QA agent for demo scripts | Revisit with F-DESIGN-SYSTEM (F-FOUND-PREVIEW-E2E) |
| Reviewing PRs opened outside Claude Code (by hand, Dependabot) | None: they get `docs:check` only, as today |
| Checking that a Vercel or GitHub setting exists (only that it is documented) | Not planned: needs account tokens |

## Affected modules
- Repo config: `.claude/agents/docs-reviewer.md` (new), `tools/docs-check/` (hook message, secrets rule, tests), `.github/pull_request_template.md`.
- Docs: `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`, `docs/FEATURES.md`, `docs/demos/stage-0.md`, `docs/features/F-FOUND-PIPELINE/plan.md` (pointer), new ADR.
- No application code.

## Data model and API changes
None.

## Conventions
- **Secrets:** the new rule checks names only; values never appear in docs or in the reviewer's input.
- **Subagents:** CLAUDE.md records that the hook asks for this one agent, so spawning it is the user's standing request, not a default.

## UI screens
None.

## Test plan
- **Unit:**
  - hook decisions: the deny message names the reviewer; a Markdown-only commit after a review is allowed; a code commit after a review asks again; the chained-commit rule is unchanged;
  - the secrets rule on fixtures: a missing secret, a missing `vars` entry, a missing `.env.example` variable, and `GITHUB_TOKEN` exempt.
- **Replay (acceptance):** the reviewer runs on the diffs of three merged PRs and must report what went stale there:
  - #16 (the README `pnpm check` comment, which doesn't list the new `i18n:check`);
  - #17 (`VERCEL_AUTOMATION_BYPASS_SECRET` missing from the secrets table, and the Stage 0 scope in ROADMAP without the new feature);
  - #24 (the README status line still says Stage 0 is in progress).
  - It must also report "No findings" on #25, which only fixed docs.
  - Results go into the PR.
- **On this PR:** the hook asks for the reviewer, its findings are fixed or answered in "Docs", and the retry opens the PR.

## Implementation steps
1. `docs(docs): plan docs reviewer agent`: this plan, the ADR, FEATURES.
2. `build(docs): check that secrets and variables are documented`: README secrets section, the `docs:check` rule with tests, the F-FOUND-PIPELINE pointer.
3. `build(docs): add the docs reviewer agent`: `.claude/agents/docs-reviewer.md`; replay on #16, #17, #24 and #25 with both candidate models, prompt tuned until it passes, the model pinned.
4. `build(docs): ask for the docs reviewer before a pr`: hook message and the Markdown-only rule, with tests.
5. `docs: hand the docs review to the reviewer agent`: README de-duplication, CLAUDE.md, ROADMAP, tool README, PR template, Stage 0 demo step 15.

## Done when
- The replay finds the known stale docs in #16, #17 and #24, and nothing in #25.
- On this PR, the hook asked for the reviewer and the "Docs" section records its findings.
- `docs:check` fails on an undocumented workflow secret.
- Baseline definition of done: lint, typecheck, unit, integration and E2E pass in CI; "Preview E2E" green; docs current.

## Risks and open questions
- **Not deterministic:** the reviewer can miss a stale statement or report a false one. Mitigations:
  - the replay as an acceptance test, rerun when the prompt changes;
  - findings are answered in the PR, where you see them;
  - `docs:check` stays the deterministic gate.
- **Cost and time:** one extra agent run per PR (decision 5 picks the model). A Markdown-only fix after a review doesn't trigger another run.
- **Context size:** a large diff (a whole feature) plus all living docs may be long. The agent reads the diff first, then only the docs it points to, plus the fixed short list (README, CLAUDE.md, ROADMAP, FEATURES).
- **Self-review bias stays partly:** I write the prompt and fix the findings. The replay on PRs that you saw go stale is the independent check.

## Decisions (approved 2026-11-12)
All approved as recommended; decision 5 changed from `inherit` to a pinned model during review.
1. **Placement:** recommended: a Stage 0 feature, because it is foundation tooling like F-FOUND-DOCS. Stage 0 reopens (7/8) until it is done; only demo step 15 is rerun. Alternative: the first feature of Stage 1 (keeps Stage 0 closed, but mixes tooling into tenancy).
2. **Reviewer agent instead of the doc-map review ([ADR-0021](../../adr/0021-documentation-review-by-a-reviewer-agent.md)):** recommended: a read-only subagent with a fixed list of living docs, triggered by the existing hook, supersedes ADR-0017's doc-map review. `docs:check` stays in CI. Alternatives:
   - more mechanical rules and a close-out checklist in the hook (deterministic, but every new kind of doc dependency needs a new rule);
   - keep ADR-0017 as is.
3. **Where it runs:** recommended: in Claude Code through the hook, because almost every PR is opened there and it needs no API key. Alternative: `claude-code-action` in GitHub Actions on every PR (also covers PRs opened by hand; needs an API key in a public repository and costs per push).
4. **Re-review after fixes:** recommended: after a review, a commit that only touches `*.md` files goes through without another run, because those are the review's own fixes. A commit that changes anything else asks again. Alternative: review again on every new HEAD (safer, doubles runs on most PRs).
5. **Model:** pinned by full ID, not `inherit` or an alias, so the replay result holds for the model that runs: with `inherit` the review would change with the session's model, and an alias moves silently on new releases. Step 3 runs the replay on `claude-opus-5-5` and `claude-sonnet-5-5` and pins the cheaper one that passes all of it (all known findings in #16, #17 and #24, none in #25). Changing the model is its own commit followed by a rerun of the replay, like the Playwright image tag.
6. **De-duplication and the secrets rule:** recommended: do both here (scope above), because they remove the four cases from the background for good. Alternative: the reviewer alone.

## Deviations
1. **Model: `claude-opus-5-5`.** The replay ran on both candidates (results in `tools/docs-check/README.md`, "Docs reviewer"). Sonnet reported every expected finding, but twice it read the newer checkout, where this plan's "Background" names the answers, despite an explicit rule not to. Its #17 result doesn't count, so Opus is the cheaper model with a clean pass. The lesson is in the replay instructions: paste the agent's prompt instead of pointing at the checkout.
2. **The first attempt is denied even when nothing is mapped.** The plan kept the old "allow at once" for branches with no mapped code. That would let docs-only PRs skip the review, and #24, which left the README status line stale, was one of them.
3. **A Markdown-only follow-up passes only if the reviewed HEAD is its ancestor.** The stamp is per clone, not per branch, so a stamp from another branch must not let a branch through.
4. **Fixes from the replay, outside the planned scope.** The replay also found true staleness on `main`, fixed in step 5:
   - the CLAUDE.md "Time" rule now names `src/i18n/format.ts`;
   - `src/i18n/README.md` no longer places `LocalizedText` there (ADR-0019);
   - the Vercel Pro timing for Cron is noted in ROADMAP Stage 4, F-EVENTS-OUTBOX and F-RELEASE-READINESS;
   - the README hosting row also links ADR-0010 for the Hobby plan;
   - ROADMAP points to the README for secrets;
   - the Stage 0 demo run names #24, the stage's last PR, for the automated steps.

   Not fixed, as history: the squash commit of #17 (`b6bb8b8`) carries #16's description and `Refs: F-FOUND-I18N`.
5. **Text inside a heredoc can trigger the hook.** It happened twice while building this. It only costs a review and is noted in the tool README; not worth a parser.
6. **The #25 criterion was loosened during the replay**, from "No findings" to "no false finding". Both models found true staleness in #25 (deviation 4), so "No findings" would have failed the reviewer for being right. The plan's Test plan and Done when still say "No findings"; the tool README states the criterion now used.
7. **The agent may run five read-only git commands**, not only `git diff` and `git log`: `git show`, `git merge-base` (step 1 needs it) and `git ls-files` too.
8. **First real run, on this branch**, as a general-purpose agent with the same prompt and model, because Claude Code loads `.claude/agents/` at session start. It found six issues; five are fixed here:
   - the README status line repeated its sentence;
   - the ROADMAP Stage 0 scope still described the doc-map review;
   - deviations 6 and 7 were missing;
   - demo step 15 wasn't attributed to this feature, and no step showed the secrets rule.

   The sixth, the hook's `statusMessage` in `.claude/settings.json` still saying "Reviewing the doc map", waits for the product owner, since it is harness configuration.
9. **Stage 0 stays `in progress`** until demo step 15 (the hook asks for the reviewer) and the new part of step 16 (the secrets rule failing in CI) have been run on a PR after this merge.
