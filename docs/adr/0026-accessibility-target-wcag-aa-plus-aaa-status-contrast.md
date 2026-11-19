# ADR-0026: Accessibility target: WCAG 2.2 AA, plus AAA contrast on customer status screens

- **Status:** accepted
- **Date:** 2026-11-19
- **Related:** F-DESIGN-DECISIONS, F-DESIGN-SYSTEM, every UI feature, F-RELEASE-READINESS (accessibility audit), ROADMAP question 19, [ADR-0023](0023-venue-branding-logo-and-accent-color.md)

## Context
The European Accessibility Act applies EN 301 549, which references WCAG AA, to consumer-facing digital services. Customers read their ticket, position and called state on their own phone, often outdoors in sunlight and with low attention. Staff use tablets at arm's length with wet or greasy hands. Venue accent colors are chosen by the venue, not by us.

## Decision
The accessibility target for every surface is WCAG 2.2 AA. Key information on the customer status and called screens (ticket number, position, ETA, the called state) meets AAA contrast, 7:1. Touch targets are at least 44×44 px on customer screens and 48×48 px on staff screens. The commitments and the verification (axe in Playwright on CI, manual VoiceOver and TalkBack passes each stage) are listed in [DESIGN.md](../DESIGN.md) §4.

## Alternatives considered
- **WCAG 2.2 AA only:** status screens may be hard to read in sunlight.
- **WCAG 2.2 AAA throughout:** not achievable for all content; disproportionate effort.

## Consequences
- **Positive:** aligned with the European Accessibility Act; the most-read screens stay legible outdoors.
- **Negative / accepted trade-offs:** venue accent colors are adjusted where they would break the 7:1 target ([ADR-0023](0023-venue-branding-logo-and-accent-color.md)); the palette has less freedom on customer screens.
- **Follow-ups:**
  - F-DESIGN-SYSTEM wires axe into Playwright and checks the token pairs against the targets in both modes.
  - The baseline definition of done in ROADMAP refers to this target.
