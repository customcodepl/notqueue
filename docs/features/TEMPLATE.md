# Plan template

Copy this structure into `docs/features/<feature-id>/plan.md`, then replace the italic guidance with content specific to the feature.
- Keep the plan short.
- Don't repeat ROADMAP or README; link to them instead.
- If a section doesn't apply, write "None." and give the reason in one line.

The [F-FOUND-REPO plan](F-FOUND-REPO/plan.md) is a good example of the expected level of detail.

```markdown
# <FEATURE-ID>: <Feature name>

- **Stage:** <n> (<stage name>)
- **Status:** plan drafted (<YYYY-MM-DD>)
- **Depends on:** <IDs, or none>
- **Unblocks:** <IDs of the features that depend on this one>
- **ADRs:** <related ADRs, or none>

## Goal
_One or two sentences: what can be observed once this is done._

## Scope
_Concrete items: files, tables, endpoints, scripts, screens. Include what the dependent features need from this one._

## Out of scope
| Item | Feature that delivers it |
|---|---|

## Affected modules
_By layer: core, application, infra, api, app, i18n, plus repo config._

## Data model and API changes
_Migrations written out: tables, columns, types, defaults, indexes, RLS policies. Endpoints: method, path, auth, schemas and errors._

## Conventions
_Only the CLAUDE.md conventions that apply here, one line each on how this feature meets them. Examples: which tables get `org_id` and RLS, which state changes write outbox events, what goes into the isolation suite, which strings are translated, how time is handled._

## UI screens
_Each screen, with references to the DESIGN.md sections and the mockup._

## Test plan
_Unit, integration (real Postgres with RLS), E2E, manual._

## Implementation steps
_Small steps. Each one ends green and becomes one commit._
1. `<type>(<scope>): <subject>`: what this step does.

## Done when
_This feature's part of the stage's "Done when", plus the applicable items of the baseline definition of done._

## Risks and open questions
_Risks with mitigations. List any blocking ROADMAP questions with a recommended answer; the plan can't be approved until they're answered._

## Decisions to confirm
_Mark decisions that need an ADR (CLAUDE.md rule 7) with **(ADR)**._
1. **<Topic>:** recommended <X>, because <reason>. Alternative: <Y>.

## Deviations
_To be filled in after implementation._
```
