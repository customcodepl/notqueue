# ADR-0024: UI foundation: shadcn/ui on Radix with two-layer Tailwind tokens

- **Status:** accepted
- **Date:** 2026-11-19
- **Related:** F-DESIGN-DECISIONS, F-DESIGN-MOCKUPS, F-DESIGN-SYSTEM, every UI feature, [ADR-0023](0023-venue-branding-logo-and-accent-color.md)

## Context
Four surfaces (customer, staff, venue admin, operator) need accessible components built by a solo developer, on Tailwind v4, which the repo already uses. The look must support light and dark modes and a venue accent color set at runtime, and the hi-fi mockups should use the same values as the code. The customer pages have a JS budget of 100 KB gzip.

## Decision
We build UI components on shadcn/ui: Radix primitives whose code is copied into the repo and owned by us, styled with Tailwind. Styling goes through Tailwind v4 `@theme` CSS variables in two layers: primitive tokens (palette and scales) and semantic tokens (`bg`, `fg`, `muted`, `border`, `primary`, `brand`, and the status tokens). Components use semantic tokens only, so light, dark and the venue `brand` are swaps of variable values.

## Alternatives considered
- **React Aria Components:** best-in-class accessibility and i18n helpers, but more verbose and more styling work, with a smaller Tailwind ecosystem.
- **Components from scratch:** slow, and accessibility would be ours to solve.
- **One layer of semantic tokens:** simpler, but no shared scale behind the light, dark and brand variants.

## Consequences
- **Positive:** accessible primitives with code we control; tokens shared by mockups and code; theming without per-component overrides.
- **Negative / accepted trade-offs:** the default shadcn look is common, so our tokens carry the identity; we maintain the copied components ourselves.
- **Follow-ups:**
  - F-DESIGN-SYSTEM sets the token values and adds lint against ad-hoc colors and sizes.
  - Each Radix component added to the customer pages is checked against the JS budget.
