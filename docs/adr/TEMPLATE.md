# ADR template

Copy this structure into `docs/adr/NNNN-kebab-title.md` (next free number) and add a row to the [index](README.md).
- Keep it to about one screen.
- Don't repeat README or plans; link to them instead.
- When and how to write an ADR: see "Record architecture decisions" in [CLAUDE.md](../../CLAUDE.md).

```markdown
# ADR-NNNN: <Decision as a short noun phrase>

- **Status:** proposed | accepted | superseded by [ADR-NNNN](NNNN-....md) | deprecated
- **Date:** <YYYY-MM-DD> (date of the decision)
- **Related:** <feature IDs, ROADMAP question numbers, other ADRs>

## Context
_2–5 sentences: the problem, the forces and constraints (GDPR, cost, solo developer, serverless). No solution here._

## Decision
_1–3 sentences in the active voice: "We use X for Y."_

## Alternatives considered
- **<Option>:** why it was rejected, in one line.

## Consequences
- **Positive:** …
- **Negative / accepted trade-offs:** …
- **Follow-ups:** _the rules, features or checks this creates, or "None."_
```
