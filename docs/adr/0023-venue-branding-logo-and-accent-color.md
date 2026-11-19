# ADR-0023: Venue branding: logo and one accent color, contrast adjusted automatically

- **Status:** accepted
- **Date:** 2026-11-19
- **Related:** F-DESIGN-DECISIONS, F-DESIGN-SYSTEM, F-VENUE-BRANDING, F-VENUE-QR, ROADMAP question 13, [ADR-0024](0024-ui-foundation-shadcn-and-two-layer-tokens.md), [ADR-0026](0026-accessibility-target-wcag-aa-plus-aaa-status-contrast.md)

## Context
Customers reach a venue's queue by scanning a QR code. If the page shows only the product brand, it looks like a third party, and trust at that moment is weaker. Every branding option widens the design and QA matrix, and an arbitrary venue color can break the contrast target on the screens where customers read their status, often outdoors. Customer screens show branding from Stage 3, but venues configure it only in Stage 5.

## Decision
Customer screens show the venue's logo in a fixed slot and one venue accent color, applied through the runtime `brand` token, plus a small "Powered by" product mark. An accent that fails the contrast check against the light or dark background is replaced by a derived darker or lighter variant, and the admin UI previews the result in both modes. Status colors are never taken from the brand. Staff, admin and operator screens use the product brand only.

## Alternatives considered
- **Product brand only:** the venue's customers feel sent to a third party.
- **Full theming** (palette, font, background image, custom domain): a large design and QA matrix and accessibility risk; kept as a possible paid tier later.
- **Reject a failing accent in the admin UI:** venues usually can't change their brand color, so a rejection blocks them instead of protecting customers.

## Consequences
- **Positive:** recognizable venue screens at low cost; contrast is guaranteed by the system, not by the admin.
- **Negative / accepted trade-offs:** the color a venue sees may differ from the one it entered; branding is limited to a logo and one color.
- **Follow-ups:**
  - F-DESIGN-SYSTEM provides the `brand` token with a product default and the contrast-adjustment function (pure, in `core`, tested against both modes).
  - F-VENUE-BRANDING adds the logo upload and the accent color with the preview.
  - Deeper theming needs a new ADR.
