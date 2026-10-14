# ADR-0001: Record architecture decisions

- **Status:** accepted
- **Date:** 2026-10-13
- **Related:** [CLAUDE.md](../../CLAUDE.md) workflow rule 7

## Context
Feature-local decisions are recorded in each plan, and open questions in [ROADMAP](../ROADMAP.md). System-wide decisions (hosting, tenancy, real-time, data residency) appear in the README only as conclusions, without the rejected alternatives or the trade-offs. Without those, a later change risks reopening a settled question or breaking an assumption silently.

## Decision
We record system-wide, costly-to-reverse decisions as short MADR-style ADRs in `docs/adr/`. Accepted ADRs are immutable except for status and links; a change of decision is a new ADR that supersedes the old one.

## Alternatives considered
- **Keep rationale in README:** README would grow and mix "what" with "why"; superseded reasoning gets lost.
- **Full MADR or Nygard template:** more ceremony than a solo project needs.
- **Rationale in plans only:** cross-cutting decisions don't belong to a single feature.

## Consequences
- **Positive:** the reasoning behind core choices survives; plans link to an ADR instead of repeating it.
- **Negative / accepted trade-offs:** one more doc type to keep in sync with README.
- **Follow-ups:** README keeps its content and links to the relevant ADRs.
