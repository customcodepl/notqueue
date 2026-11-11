# ADR-0020: Stage demos partly automated on PR previews

- **Status:** accepted
- **Date:** 2026-11-11
- **Related:** F-FOUND-PREVIEW-E2E, F-FOUND-PIPELINE (decision 4), [ADR-0010](0010-deploy-pipeline-without-staging-deployment.md)

## Context
The baseline definition of done requires each stage's demo script to be run on the deployed preview ([ROADMAP](../ROADMAP.md)). The scripts grow with every feature, and most steps check a deterministic result in a browser or over HTTP, which the E2E suite already checks, but only against a local build without a database. F-FOUND-PIPELINE kept E2E local to avoid the Vercel protection bypass and cold-start flakiness. Previews are the only deployed environment before production ([ADR-0010](0010-deploy-pipeline-without-staging-deployment.md)), and the repository is public.

## Decision
We run the Playwright suite against every PR preview, triggered by Vercel's `repository_dispatch` event `vercel.deployment.success`, reported as a "Preview E2E" commit status on the deployed commit, and authenticated with Vercel's Protection Bypass for Automation secret. A demo step whose expected result such a spec checks is marked _automated_ in the demo script. A stage's demo counts as run when "Preview E2E" is green on the preview of the stage's last PR and its manual steps (real devices, third-party UIs, judgment) were done.

## Alternatives considered
- **Keep every demo step manual:** the scripts grow each stage, and the deployed app is checked only once, at the end of a stage.
- **A Claude Code QA agent on every PR:** costly per run and not deterministic, so it can't be a gate. It may come later for exploratory checks.
- **Turn off Vercel Authentication on previews:** exposes the staging database to anyone with the URL.

## Consequences
- **Positive:** every PR is checked on `fra1` and Supabase staging; the manual part of a demo shrinks to what needs a person.
- **Negative / accepted trade-offs:** a repository secret grants access to every preview, so traces stay off on previews (artifacts of a public repository are readable by anyone). Runs depend on Vercel's deployment events and on cold starts; the workflow always runs from `main`, so a change to it takes effect only after merge.
- **Follow-ups:** features that add demo steps write the automatable ones as specs; specs that write to Supabase staging need a naming and cleanup rule, defined by the first feature that needs it. The check is not required in branch protection until it has been stable for a stage.
