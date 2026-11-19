# ADR-0028: Mockups in claude.ai artifacts, with the repo as the source of truth

- **Status:** accepted
- **Date:** 2026-11-19
- **Related:** F-DESIGN-MOCKUPS, F-DESIGN-SYSTEM, every UI feature, [ADR-0024](0024-ui-foundation-shadcn-and-two-layer-tokens.md), [DESIGN.md §8](../DESIGN.md#8-mockups--review-process)

## Context
The mockup process is low-fi sketches, then hi-fi mockups in a design tool, with the product brand designed in parallel. The hi-fi must use the same tokens that F-DESIGN-SYSTEM puts in code. Claude makes the mockups and the product owner reviews them on a phone and a tablet. Design tools keep their files outside the repo, and links to them can break or change after approval, while every UI feature is later checked against the "approved mockups".

## Decision
We make the mockups as private claude.ai artifacts: a Design canvas for the low-fi and hi-fi screens, and a Design System artifact as the reference for the brand and the tokens, which the hi-fi reads. When the mockups are approved, the repo receives everything the code depends on: the final token values in DESIGN.md §3.2, the brand assets under `public/brand/`, and a PDF export of the approved screens in `docs/design/`. The repo copy wins over the artifacts.

## Alternatives considered
- **Hand-written HTML mockups in the repo:** versioned and reviewable in PRs, but slower to iterate and with no canvas to compare variants side by side.
- **Figma:** the standard tool, but needs a designer's seat and has a handoff gap to the code (rejected in DESIGN.md §8).

## Consequences
- **Positive:** fast iteration on a canvas; one token reference shared by the brand and the screens; the code never depends on an external link.
- **Negative / accepted trade-offs:** the artifacts are hosted by Anthropic, outside the EU. They hold invented sample data only, never personal data, so data residency ([ADR-0003](0003-eu-regions-of-us-providers.md)) is not affected. The token values are copied by hand into DESIGN.md.
- **Follow-ups:**
  - F-DESIGN-MOCKUPS adds the token values, brand assets and PDF export at approval.
  - A later mockup change that alters tokens updates DESIGN.md §3.2 in the same PR as the code.
