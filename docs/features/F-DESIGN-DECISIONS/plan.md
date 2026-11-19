# F-DESIGN-DECISIONS: Design decisions

- **Stage:** 2 (Design foundations), product track
- **Status:** plan approved (2026-11-19)
- **Depends on:** none
- **Unblocks:** F-DESIGN-MOCKUPS; through it F-DESIGN-SYSTEM and every UI feature from Stage 2 on. Its decisions also feed F-VENUE-BRANDING (branding depth, contrast guard), F-CALLED-EXPERIENCE (called moment, staff fallback signals) and F-VENUE-SETTINGS (a staff theme default, if chosen)
- **ADRs:** ADR-0023 to ADR-0027 from the decisions marked **(ADR)** below (written in step 3); [ADR-0003](../../adr/0003-eu-regions-of-us-providers.md) (EU data residency, relevant to self-hosted fonts)

## Goal
Every section of [DESIGN.md](../../DESIGN.md) has a filled-in **Decision**, the options not picked are reduced to a short "Considered" note, and the decision log records each one with its date. F-DESIGN-MOCKUPS can then start without design questions open.

## Scope
- Decide and record in DESIGN.md, section by section:
  1. Surfaces, user contexts and the customer-surface budgets (§1).
  2. Product brand vs per-venue branding, with the contrast guardrails (§2).
  3. Component foundation, token structure, icon set, fonts (§3.1–3.4).
  4. Accessibility target and commitments (§4).
  5. Light/dark mode per surface, including where the staff default lives (§5).
  6. The "you're called" moment: mitigations, staff fallback signals, called-screen design (§6).
  7. Layouts for text expansion and the pseudo-locale (§7).
  8. Mockup and review process: who makes them, who signs off, whether real users test them (§8).
- Answer ROADMAP open questions 13, 14, 16, 17 and 19 (they block this feature) and mark them resolved there.
- Write the ADRs for the decisions marked **(ADR)**, as `accepted`, in this branch.
- Change the DESIGN.md status line from "skeleton, awaiting decisions" to "decisions made; mockups pending".

What the dependent features need from this one:
- **F-DESIGN-MOCKUPS:** the token proposal (§3.2) concrete enough to mock up with (semantic token names, type scale with a display step, spacing, radius), the font and icon set, both modes, and the branding variant to show.
- **F-DESIGN-SYSTEM:** the component foundation, the two-layer token model with a runtime `brand` token (C-7 in ROADMAP), the accessibility target that axe in CI checks against.
- **F-VENUE-BRANDING:** the branding depth and the rule for an accent color that fails the contrast check (adjust automatically or reject).
- **F-CALLED-EXPERIENCE:** the chosen mitigations and whether staff see connection metadata (unblocks Q-6 in ROADMAP).

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Clickable HTML mockups and their approval | F-DESIGN-MOCKUPS |
| Final token values (exact palette, type sizes), tokens and components in code | F-DESIGN-SYSTEM |
| Product name, logo and product palette (open question 15) | F-DESIGN-MOCKUPS, in parallel with the low-fi sketches (decision 10); not needed here |
| Called-screen sound (open question 18) | F-CALLED-EXPERIENCE |
| Logo upload, storage limits (Q-7) | F-VENUE-BRANDING |

## Affected modules
Docs only: `docs/DESIGN.md`, `docs/ROADMAP.md` (open questions), `docs/FEATURES.md` (status, "Next up"), new ADRs in `docs/adr/` and the ADR index. No code.

## Data model and API changes
None. This feature records decisions. If the staff dark-mode default is set per venue (decision 6), the column is added by F-VENUE-SETTINGS, and this plan only records that need.

## Conventions
- **UI:** this feature defines the tokens, components and accessibility target that the convention "use DESIGN.md tokens and components only" refers to.
- **GDPR:** fonts self-hosted (no runtime requests to Google); the staff fallback signals (decision 7) must not expose PII, only connection state.
- **i18n:** the text-expansion rules and the pseudo-locale (decision 9) build on F-FOUND-I18N; PL is the longest supported locale (ROADMAP question 2).

## UI screens
None. The screens are mocked up in F-DESIGN-MOCKUPS.

## Test plan
- `pnpm docs:check` green (links, ADR index).
- `docs-reviewer` run on the branch before the PR.
- Manual: every DESIGN.md section has a **Decision** with no `_pending_` left; `grep -n "_pending_" docs/DESIGN.md` returns nothing.

## Implementation steps
1. `docs(design): add f-design-decisions plan`: this plan and "Next up" set to `drafted`.
2. `docs(design): record design decisions`: fill in DESIGN.md §1–§8 and the decision log; mark ROADMAP questions 13, 14, 16, 17, 19 resolved; update F-DESIGN-MOCKUPS' description and the **Blocks** of question 15 (decision 10).
3. `docs(adr): add design decision adrs`: the ADRs for the **(ADR)** decisions, the ADR index, links from DESIGN.md.
4. `docs(design): close f-design-decisions`: status `done` in FEATURES.md, "Progress" and "Next up" (F-DESIGN-MOCKUPS moves onto the product track).

## Done when
- No `_pending_` left in DESIGN.md; the decision log has an entry per section.
- ROADMAP questions 13, 14, 16, 17 and 19 are resolved (or explicitly deferred with a reason and a feature that owns them).
- The ADRs for the **(ADR)** decisions are `accepted` and indexed.
- Baseline: `pnpm docs:check` green, `docs-reviewer` findings fixed or answered in the PR. The design and i18n items of the baseline don't apply (no UI).

## Risks and open questions
- **Decisions made without mockups may change once they are seen.** Mitigation: token values stay a proposal here; F-DESIGN-MOCKUPS may refine them, and any change to an **(ADR)** decision goes through a superseding ADR.
- **The product brand is still undecided (question 15).** It doesn't block this feature or the low-fi sketches, which have no brand. It has to be settled before the hi-fi mockups (decision 10).
- Blocking ROADMAP questions, with recommended answers (they are also decisions 2, 6, 7, 8 and 10 below):
  - **13. Branding depth:** logo + one accent color; full theming possibly as a paid tier later.
  - **14. Design process:** low-fi flow sketches, then hi-fi mockups in a design tool, with the product brand in parallel; product owner signs off the hi-fi; a short test with 2–3 venue staff and customers on the hi-fi.
  - **16. Called fallback:** yes, staff see "alerts on" and "last seen" (connection state only).
  - **17. Staff dark mode:** venue default plus a per-device override.
  - **19. AAA contrast:** accepted for status and called information.

## Decisions (approved 2026-11-19)
All recommendations were accepted, decision 10 in its revised form (low-fi sketches, then hi-fi in a design tool, product brand in parallel). Decisions 3 and 4 share one ADR, as they are one choice of UI foundation.

1. **Surfaces and budgets (§1):** accept the four surfaces and principles as written, and the customer budgets (≤ 100 KB gzip JS on public pages, LCP < 2.5 s on 4G, works in in-app browsers, token stored locally). Alternative: a looser JS budget (e.g. 150 KB) if the component library makes 100 KB unrealistic.
2. **Branding (§2, question 13) (ADR):** recommended B, venue logo + one accent color on customer screens with a small "Powered by" mark, status colors never overridden; an accent that fails contrast is **adjusted automatically** (darker/lighter variant) and the admin sees a preview, rather than rejected. Alternatives: A (product brand only), C (full theming, a possible paid tier later).
3. **Component foundation (§3.1) (ADR):** recommended shadcn/ui (Radix) + Tailwind, because the code is ours, it is token-driven and Tailwind-native. Alternative: React Aria Components (stronger accessibility and i18n, more styling work).
4. **Tokens (§3.2) (ADR):** recommended two layers (primitive + semantic) as Tailwind v4 `@theme` variables, with the semantic names and the runtime `brand` token as listed; values are final in F-DESIGN-SYSTEM. Alternative: a single layer of semantic tokens only.
5. **Icons and fonts (§3.3, §3.4):** recommended Lucide and Inter (variable, self-hosted via `next/font`, Latin Extended + Cyrillic, `tnum`). The self-hosting rule (no font or asset requests to third-party CDNs) is **(ADR)**; the font and icon picks stay in DESIGN.md. Alternatives: Phosphor; IBM Plex Sans or the system stack.
6. **Accessibility (§4, question 19) (ADR):** recommended WCAG 2.2 AA plus AAA contrast (7:1) for key information on the customer status and called screens, with the touch-target and screen-reader commitments as written. Alternative: AA only.
7. **Light/dark (§5, question 17):** customer follows the system; staff has a toggle per device with a **venue default** (a venue setting in F-VENUE-SETTINGS); admin and operator follow the system plus a toggle. Alternatives for staff: per-user preference (needs a profile setting), dark only.
8. **Called moment (§6, question 16) (ADR):** recommended A + C: an "Enable alerts" tap (audio unlock, vibration on Android, Screen Wake Lock), plus staff fallback signals ("alerts on", "last seen online", connection state only, no PII) and a "come back by HH:MM" time for the customer; SMS in v1.1 is the real fix for locked phones. Alternatives: A only (no connection metadata to staff), B (passive only).
9. **Text expansion (§7):** recommended flexible layouts + a dev-only pseudo-locale (accented, ~40% longer) in visual checks, PL as the longest real locale. Alternative: none worth keeping.
10. **Mockups and review (§8, question 14):** recommended sequential, in one pass per fidelity:
    - **Low-fi flow sketches** (a day or two): join, status, called, staff dashboard on a tablet; grey boxes with real PL/EN copy, no color or brand. They check steps, information and actions only, and are not approved as a design.
    - **Product brand** (question 15: name, logo, palette) runs **in parallel** with the sketches, since it doesn't depend on the flows.
    - **Hi-fi mockups in a design tool**, built on the DESIGN.md tokens and the product brand, for every screen in §8. These are the ones you approve and the ones tested with 2–3 real venue staff and customers. They use the same tokens that F-DESIGN-SYSTEM puts in code, so the mockups and the code share one source of truth.

    Sign-off: you, recorded in the DESIGN.md decision log with links and dates. Rejected: low-fi and hi-fi fully in parallel (two sources of truth that drift, every change made twice); hi-fi straight away (polish distracts from the flow, and layout changes cost more); Figma with a designer (cost and calendar time, a handoff gap to the code).
    Consequences for other docs, done in step 2: F-DESIGN-MOCKUPS' description in FEATURES.md changes from "HTML mockups" to "low-fi flow sketches, then hi-fi mockups in a design tool", the product brand moves into its scope, and ROADMAP question 15 then blocks F-DESIGN-MOCKUPS (hi-fi) as well as F-DESIGN-SYSTEM.

## Deviations
_To be filled in after implementation._
