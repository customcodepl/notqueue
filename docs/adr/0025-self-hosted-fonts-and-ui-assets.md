# ADR-0025: Self-hosted fonts and UI assets

- **Status:** accepted
- **Date:** 2026-11-19
- **Related:** F-DESIGN-DECISIONS, F-DESIGN-SYSTEM, F-SEC-HARDENING (CSP), F-LEGAL-DOCS (subprocessor list), [ADR-0003](0003-eu-regions-of-us-providers.md)

## Context
Every request a page makes to a third-party CDN sends the visitor's IP address to that provider. A German court ruled in 2022 that loading Google Fonts from Google's CDN without consent violated the GDPR. Customer pages are opened without an account or a consent banner, and each extra origin also costs a DNS lookup and connection on a slow mobile network.

## Decision
Fonts, icons and other UI assets are bundled with the app and served from our own origin. Fonts go through `next/font` (local files), and icons are imported as components (Lucide). No page loads fonts, icons, stylesheets or scripts from a third-party CDN at runtime. The chosen font is Inter (variable, Latin Extended and Cyrillic, tabular numerals); the font choice itself stays in [DESIGN.md](../DESIGN.md) §3.4.

## Alternatives considered
- **Google Fonts or another font CDN:** sends visitors' IP addresses to a third party and needs a subprocessor entry and possibly consent.
- **System font stack only:** no download at all, but a different look per OS and no control over numeral width.

## Consequences
- **Positive:** no extra subprocessor or consent for assets; fewer origins on the customer's first load; a CSP that can stay tight.
- **Negative / accepted trade-offs:** font files count toward our own bandwidth and must be subset to keep the customer pages fast.
- **Follow-ups:**
  - F-SEC-HARDENING sets `font-src` and `img-src` to our own origin (plus Supabase Storage for venue logos).
  - Adding any runtime asset origin needs a new ADR.
