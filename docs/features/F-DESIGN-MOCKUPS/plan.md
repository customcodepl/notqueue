# F-DESIGN-MOCKUPS: Mockups and product brand

- **Stage:** 2 (Design foundations), product track
- **Status:** plan approved (2026-11-19)
- **Depends on:** F-DESIGN-DECISIONS (done)
- **Unblocks:** F-DESIGN-SYSTEM, and through it every UI feature from Stage 2 on
- **ADRs:** [ADR-0023](../../adr/0023-venue-branding-logo-and-accent-color.md) (branding), [ADR-0024](../../adr/0024-ui-foundation-shadcn-and-two-layer-tokens.md) (tokens), [ADR-0026](../../adr/0026-accessibility-target-wcag-aa-plus-aaa-status-contrast.md) (contrast), [ADR-0027](../../adr/0027-called-moment-enable-alerts-and-staff-fallback.md) (called moment); [ADR-0028](../../adr/0028-mockups-in-artifacts-with-the-repo-as-source-of-truth.md) (decision 1)

## Goal
The product brand is chosen, the hi-fi mockups of every screen in [DESIGN.md §8](../../DESIGN.md#8-mockups--review-process) are approved by the product owner after a short test with real users, and the final token values are in DESIGN.md, ready for F-DESIGN-SYSTEM to put in code.

## Scope
Following the process in DESIGN.md §8:
1. **Low-fi flow sketches** of join → status → called and the staff dashboard (tablet, portrait and landscape): grey boxes, real PL and EN copy, no color or brand. One feedback round with you.
2. **Product brand** (ROADMAP question 15), in parallel with 1: 2–3 directions (wordmark, product primary, neutral and status palette, type pairing with Inter), you pick one; the chosen one becomes the **design system reference** (decision 1) with the token values for light and dark.
3. **Hi-fi mockups** built on that reference, for all §8 screens: join, status, called, staff dashboard, queue configuration, venue settings, QR poster (A4, A5). Variants per decision 4. The branding variant uses a sample venue whose accent **fails** the contrast check, to show the automatic adjustment (ADR-0023). The called screen shows the enable-alerts step, the "come back by" time and the staff fallback signals (ADR-0027).
4. **User test** of the hi-fi with 2–3 venue staff and 2–3 customers (decision 5); findings and the changes they led to go into this plan.
5. **Approval:** the decision log in DESIGN.md records the approved links, versions and dates; DESIGN.md §3.2 gets the final token values (palette, type scale, spacing, radius, motion) so the repo, not the mockup tool, is the source of truth.

What F-DESIGN-SYSTEM needs from this feature: the final token values in DESIGN.md, the chosen font weights and icon sizes, the product brand assets (wordmark as SVG, committed to the repo), and approved screens to restyle the Stage 1 console against.

## Out of scope
| Item | Feature that delivers it |
|---|---|
| Tokens, components and fonts in code | F-DESIGN-SYSTEM |
| The called sound (ROADMAP question 18) and real alert behaviour on devices | F-CALLED-EXPERIENCE |
| Operator console screens | Restyled in F-DESIGN-SYSTEM from the shared components; no mockup (DESIGN.md §1: functional over polished) |
| Trademark registration of the product name | Not planned in v1; only a conflict check here (decision 2) |

## Affected modules
Docs only: `docs/DESIGN.md` (§3.2 values, §8 links, decision log), `docs/ROADMAP.md` (question 15), `docs/FEATURES.md`, this plan, a new ADR, and the wordmark under `public/brand/` (an asset, not code). The mockups themselves live outside the repo (decision 1).

## Data model and API changes
None. Docs and design artifacts only.

## Conventions
- **UI:** the hi-fi mockups use only the reference's tokens; contrast pairs meet ADR-0026 in both modes, checked with a contrast tool and noted per screen.
- **i18n:** every screen shows real PL and EN copy (PL is the longest locale); no lorem ipsum, so text expansion is visible.
- **GDPR:** sample data is invented (no real names or phone numbers); test notes record no participant names, no recordings.
- **Time:** sample times follow the API rules (ETA as a range rounded to 5 minutes, "come back by HH:MM" in the venue timezone, 24h in PL, 12h in EN).

## UI screens
All in DESIGN.md §8, plus the enable-alerts step and the staff fallback signals from §6. Mockup links are added here and to DESIGN.md as they are published.

### Low-fi flow sketches (accepted 2026-11-19)
[notqueue low-fi flows](https://claude.ai/artifact/MFPp9nM3yKsqBJTjBPUyeE) (private canvas, version 10). Copy in PL, EN behind a `locale` tweak; boards 1–4 and 5 → 7 → 8 are clickable.
1. Join: venue logo slot, language switch, queue length and ETA range, name (required), party size, phone (optional, with why), consent.
2. Enable alerts: a separate step after joining, with what works and what doesn't (locked phone).
3. Status: ticket, people ahead, ETA range, "come back by", alerts and screen-on state, how to restore, leave.
4. Called: full screen, icon + text + ticket + where to go, "I'm coming", re-alert note.
5–6. Staff dashboard, portrait and landscape: queue tabs, entries with party size, wait and the fallback signal; called and overdue marked by border, not color; undo bar; in landscape a separate "Called" panel with served, no-show, call again.
7–8. **Walk-in** (added after review): staff add a customer (name, party size as one-tap buttons, optional phone and note), then turn the tablet to show a QR code for that entry, so the customer follows the queue without typing; it returns to the queue after "Done" or 60 s.

### Product brand (chosen 2026-11-19)
- **Name:** "notqueue" is final (product owner). Conflict check on 2026-11-19: no "notqueue" mark or product found; the product owner checked the EU registers (TMview) and found them clear. The closest name is the US mark NOQUEUE (NoQueue Inc, serial 87439071, a waiting-time app; its status is unclear), which doesn't cover the EU. Have a patent attorney confirm before the public launch.
- **Directions:** [notqueue brand directions](https://claude.ai/artifact/Xev8AmUXsEjAiMfkCuwxz2) (private canvas): A ink and green, B warm signal, C mono and lime, plus C with cyan and violet. C was rejected as too close to an existing restaurant chain's black-and-lime look.
- **Chosen: B, warm signal.** Warm orange product color on a cream page, a deep blue reserved for the called state, soft shapes (pill buttons, round mark). Wordmark "notqueue." in Inter 800 with the dot in the product color. The mark is a disc with three bars that get shorter: a queue that moves.
- **Design system reference:** [notqueue design system](https://claude.ai/artifact/9697Y5HQEFTNeRETjUBkg1) (private), version 2: light and dark color tokens with usage notes and contrast, type scale, spacing, radii, brand book. The hi-fi mockups install it. Its values are copied into DESIGN.md §3.2 at approval (step 6).
- **Assets in the repo:** the mark, `public/brand/notqueue-mark.svg`. The wordmark as outlined SVG waits for the self-hosted Inter files from F-DESIGN-SYSTEM (deviation 1).

### Hi-fi mockups (reviewed 2026-11-19)
[notqueue hi-fi mockups](https://claude.ai/artifact/VVwQpFVRfcrK9xxbyjLEiU) (private canvas, version 13), with the design system installed. Made in three rounds, each accepted by the product owner:
1. **Customer:** join, enable alerts, status, called. Eight variants each: PL/EN, light/dark, product default and venue branding. The sample venue accent `#F59E0B` fails white text (2.2:1), so light mode uses the adjusted `#B45309` (5.0:1) and dark mode keeps `#F59E0B` with dark text (8.1:1). The called screen never takes the venue color.
2. **Staff:** dashboard portrait and landscape, add a walk-in, QR handoff; PL/EN, light/dark. Called, overdue and waiting entries differ by border style and a labelled chip, not by color alone.
3. **Venue admin and poster:** queue configuration and venue settings (PL light, PL dark, EN light; desktop); QR poster A4 and A5 (PL/EN, with and without the venue logo; no text below 16 px).

Open placeholders on the poster and the walk-in sheet: the product domain (`[domena]`), the retention period (`[X] dni`, ROADMAP question 7) and the wording of the privacy notice (F-LEGAL-DOCS, ROADMAP question 20).

Feedback: the product owner accepted the flows as sketched. They asked whether joining should be done by the customer or by staff; the answer is both, with the customer as the main path (README and F-STAFF-ACTIONS already include walk-ins), which added boards 7–8 and ROADMAP question 20 (legal basis for walk-ins). A "staff-only joining" venue setting was noted as a possible later addition, not v1.

## Test plan
- Each hi-fi screen checked at phone (390 × 844) or tablet (820 × 1180 and landscape) size, in PL, and its contrast pairs measured.
- Hi-fi opened on a real iPhone, an Android phone and a tablet before the user test.
- The user test itself (decision 5).
- `pnpm docs:check` green; `docs-reviewer` run before the PR.

## Implementation steps
Each step ends with your feedback, not only with green checks; a commit records the outcome.
1. `docs(design): add f-design-mockups plan`: this plan, "Next up" set to `approved`, the DESIGN.md §8 variant matrix (decision 4), ADR-0028 (decision 1).
2. `docs(design): record low-fi flow sketches`: sketches published, links and your feedback in this plan.
3. `docs(design): record product brand`: the chosen direction, the design system reference link, the wordmark in `public/brand/`, ROADMAP question 15 resolved.
4. `docs(design): record hi-fi mockups`: links and versions in DESIGN.md §8.
5. `docs(design): record mockup user test`: findings and changes in this plan.
6. `docs(design): approve mockups and close f-design-mockups`: approval in the decision log, final tokens in DESIGN.md §3.2, status `done`, "Next up".

## Done when
- The product brand is chosen and ROADMAP question 15 is resolved.
- Every §8 screen has an approved hi-fi mockup, linked with a version and date in the DESIGN.md decision log.
- The user test has run and its findings are addressed or deliberately deferred.
- DESIGN.md §3.2 holds the final token values; no "proposal" left there.
- Baseline: `pnpm docs:check` green, `docs-reviewer` findings fixed or answered in the PR. The UI items of the baseline apply to F-DESIGN-SYSTEM, not here.

## Risks and open questions
- **Mockups that can't be built within the budgets.** Mitigation: hi-fi uses only shadcn-style components and Lucide icons (ADR-0024), no custom illustration on customer pages, and the JS budget is kept in mind for anything animated.
- **The mockup tool's look drifts from what Tailwind can render.** Mitigation: token values are taken from the reference into DESIGN.md at approval; F-DESIGN-SYSTEM compares the restyled screens with the mockups.
- **The user test runs without real venues** (decision 5). People from the product owner's network act as staff and customers, so findings about real venue routines (noise, rush hours, gloves) are weaker. Mitigation: the staff tasks are run standing, at arm's length from the tablet, with a time limit; the first client's staff review the dashboard again in F-STAFF-DASHBOARD.
- **Mockups live outside the repo** (private claude.ai artifacts, hosted by Anthropic). They hold invented data only, so data residency is not affected; links can break, so the repo keeps the token values, the wordmark and a PDF export of the approved screens (decision 1).
- Blocking ROADMAP question 15, with a recommended answer (decision 2): keep "notqueue" if a quick conflict check is clear; Claude proposes 2–3 brand directions, you choose; a designer polish review is optional, later.

## Decisions (approved 2026-11-19)
All recommendations were accepted. Decision 5: no venue is available, so people from the product owner's network stand in for venue staff and customers; recorded as a limitation under "Risks".

1. **Where the mockups live (ADR):** recommended: claude.ai artifacts: a **Design** canvas for the low-fi and hi-fi screens and a **Design System** artifact as the reference for tokens and the brand, which the hi-fi reads. At approval, the repo receives the final token values (DESIGN.md §3.2), the wordmark SVG and a PDF export of the approved screens (`docs/design/mockups-v1.pdf`), so nothing the code depends on lives only outside the repo. Alternative: hand-written HTML mockups in the repo (`docs/mockups/`): versioned in git and reviewable in PRs, but slower to iterate and without a canvas to compare variants side by side.
2. **Product brand (ROADMAP question 15):** recommended: keep the name "notqueue" if a quick check finds no conflict (EUIPO and UPRP trademark search in classes 9 and 42, domain, app-store names); Claude proposes 2–3 directions, you choose one; an optional designer review later, before the public launch. Alternatives: rename now (if the check finds a conflict, or you prefer another name); hire a designer for the brand now (cost and calendar time).
3. **Low-fi scope:** recommended: only the four flow screens (join, status, called, staff dashboard), since the admin screens and the poster are standard forms and a layout. Alternative: all §8 screens in low-fi too.
4. **Hi-fi variant matrix:** DESIGN.md §8 says each hi-fi screen shows PL and EN, light and dark, and the branding variant, which is 8 artboards per screen. Recommended: the full matrix for the customer screens (join, status, called); the staff dashboard in PL and EN, light and dark, without venue branding (staff screens use the product brand, ADR-0023); admin screens in PL, light and dark, plus one EN artboard each; the QR poster in PL and EN, with and without the venue logo. This changes DESIGN.md §8, so the wording is updated in step 1. Alternative: the full matrix everywhere.
5. **User test:** recommended: 20-minute sessions with 2–3 venue staff (tablet, the dashboard tasks: call, undo, spot who has alerts off) and 2–3 customers (phone, join → status → called), using the hi-fi screens as a click-through, notes only, no recordings, invented data. Recruiting is the product owner's: people from their network stand in for venue staff and customers. Alternative: skip the customer sessions and test with staff only.

## Deviations
1. **The wordmark SVG is not in the repo yet.** An SVG wordmark has to be outlined (text converted to paths) from the Inter font file, which the repo doesn't hold until F-DESIGN-SYSTEM self-hosts it. Step 3 commits only the mark; F-DESIGN-SYSTEM adds `public/brand/notqueue-wordmark.svg`, outlined from that file.
2. **The conflict check was split.** Claude searched the web; the product owner checked the EU registers (TMview), as search results don't replace them.
