# Design

> Status: **decisions made (2026-11-19); mockups approved (2026-11-20).** Each section states its **Decision**; the options not picked are kept as a short "Considered" note. F-DESIGN-SYSTEM puts the tokens in §3.2 into code.

This document is the reference for every UI stage. The baseline definition of done in [ROADMAP.md](ROADMAP.md) requires each stage to match it.

---

## 1. Surfaces & user contexts

| Surface | Device | Context | Design principles |
|---|---|---|---|
| **Customer** (join, status, called) | Own phone, often in an in-app browser opened by a QR scanner | One-time use, no install, no login, possibly outdoors in sunlight, low attention, poor connection | One primary action per screen; minimal form; huge ticket number and position; high contrast; fast on slow networks; works with no account and no install; recoverable if the tab is closed |
| **Staff** (dashboard) | Tablet (portrait and landscape), sometimes a phone | Busy, noisy, wet or greasy hands, glanced at between other tasks | Glanceable at arm's length; the key facts (ticket, party size or service, wait time) are the largest elements; one-tap primary actions; **undo instead of confirm dialogs**; no hover-only UI; visible connection status |
| **Venue admin** | Desktop or laptop, sometimes a tablet | Occasional, deliberate configuration | Standard, dense-enough forms; clear save and validation states; per-language content editing; responsive down to tablet |
| **Platform operator** | Desktop | Internal and infrequent | Functional over polished; tables and forms from the shared component set |

**Customer-surface budgets:**
- JS ≤ 100 KB gzip on the public pages.
- LCP < 2.5 s on a mid-range phone over 4G.
- The page must work inside the iOS camera → Safari and Android Lens / in-app browser flows.
- Store the entry token locally so that re-scanning the QR code restores the status page.

**Decision (2026-11-19):** the four surfaces, their principles and the customer-surface budgets as above.

---

## 2. Product brand vs per-venue branding

The customer-facing screens show the venue's identity. Staff, admin and operator screens show the product brand.

**Decision (2026-11-19):** **venue logo + one accent color** on customer screens, with a small "Powered by" product mark ([ADR-0023](adr/0023-venue-branding-logo-and-accent-color.md); ROADMAP question 13).

**Guardrails:**
- The accent color must pass a contrast check against the light and dark backgrounds. If it fails, the system **derives a darker or lighter variant automatically**, and the admin UI previews the adjusted color in both modes. The color is not rejected.
- The logo is shown in a fixed slot with max dimensions.
- Status colors (called, warning, error) are never overridden by brand colors.

**Considered:** product brand only (venues feel they send customers to a third party, weaker trust at the QR moment); full theming with palette, font, background and custom domain (a large design and QA matrix and accessibility risk; a possible paid tier later).

---

## 3. Design system

### 3.1 Component foundation
**Decision (2026-11-19):** **shadcn/ui (Radix primitives) + Tailwind**. The component code is copied into the repo and owned by us, and it is driven by the tokens in §3.2 ([ADR-0024](adr/0024-ui-foundation-shadcn-and-two-layer-tokens.md)).

**Considered:** React Aria Components (best-in-class accessibility and i18n helpers, but more verbose and more styling work); custom components from scratch (slow, and accessibility would be ours to solve).

### 3.2 Design tokens
**Decision (2026-11-19):** Tailwind v4 `@theme` CSS variables in two layers ([ADR-0024](adr/0024-ui-foundation-shadcn-and-two-layer-tokens.md)). Components use semantic tokens only.
- **Primitive tokens**: the palette and scales.
- **Semantic tokens**: the color tokens in the table below: surfaces and text (`bg`, `surface`, `fg`, `muted`, `border`, `border-input`), the product color (`primary`, `on-primary`, `primary-text`), `brand` (set per venue at runtime), the called state (`called`, `on-called`), the statuses `waiting`, `served` (also used for success), `no-show`, `warning`, `danger`, and `focus`.

**Values (approved with the mockups, 2026-11-20).** The source is the [notqueue design system](https://claude.ai/artifact/9697Y5HQEFTNeRETjUBkg1), version 2. This table is the repo copy and wins over it ([ADR-0028](adr/0028-mockups-in-artifacts-with-the-repo-as-source-of-truth.md)).

| Color token | Light | Dark | Use and contrast |
|---|---|---|---|
| `bg` | `#FFFBF5` | `#1C1917` | Page background |
| `surface` | `#FFFFFF` | `#292524` | Cards, rows, sheets, inputs |
| `fg` | `#1C1917` | `#FAFAF9` | Text, ticket, position, ETA (≥ 14.5:1) |
| `muted` | `#57534E` | `#A8A29E` | Secondary text only (light 7.4:1, dark 6.0:1) |
| `border` | `#E7E5E4` | `#44403C` | Decorative dividers |
| `border-input` | `#78716C` | `#78716C` | Inputs, steppers, secondary buttons (light 4.8:1, dark 3.2:1) |
| `primary` | `#C2410C` | `#FDBA74` | Product color, fill only |
| `on-primary` | `#FFFFFF` | `#1C1917` | Labels on `primary` (light 5.2:1, AA only: never key status) |
| `primary-text` | `#9A3412` | `#FDBA74` | Product color as text or link (≥ 7.1:1) |
| `brand` | = `primary` | = `primary-text` | Venue accent at runtime, adjusted for contrast (ADR-0023) |
| `called` | `#1E3A8A` | `#93C5FD` | Called state; never branded |
| `on-called` | `#FFFFFF` | `#1C1917` | Text on `called` (≥ 9.7:1) |
| `waiting`, `no-show` | `#57534E` | `#A8A29E` | Status labels, always with a word |
| `served` | `#14532D` | `#86EFAC` | Served and success (≥ 8.8:1) |
| `warning` | `#78350F` | `#FCD34D` | Warnings, overdue calls (≥ 8.8:1) |
| `danger` | `#991B1B` | `#FCA5A5` | Errors, destructive actions (≥ 8.1:1) |
| `focus` | `#1E3A8A` | `#93C5FD` | 2 px focus ring, 2 px offset |

| Category | Values |
|---|---|
| Typography (Inter) | `display-xl` 96/1 800 · `display` 72/1 800 · `h1` 32/38 700 · `h2` 24/30 700 · `title` 20/26 600 · `body` 16/24 400 · `body-strong` 16/24 600 · `small` 14/20 400 · `caption` 13/18 500; tabular numerals for numbers |
| Spacing | `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48 (px) |
| Radius | `radius-sm` 8 · `radius-md` 16 · `radius-lg` 24 · `radius-full` 9999 (px); buttons are pills |
| Elevation | None: borders before shadows |
| Motion | 150–250 ms ease-out, state changes only; respects `prefers-reduced-motion` |
| Touch targets | ≥ 44 px customer, ≥ 48 px staff, 56 px primary staff actions |

**Considered:** a single layer of semantic tokens only (simpler, but no shared scale behind the light, dark and brand variants).

### 3.3 Icon set
**Decision (2026-11-19):** **Lucide**. Icons always come with a text label on primary actions, since meaning varies across cultures. Sizes (approved with the mockups, 2026-11-20): 2 px stroke; 20 px next to text, 24 px on buttons; colored by the text token beside them.

**Considered:** Phosphor (several weights, not the shadcn default); Heroicons (smaller set).

### 3.4 Fonts
Requirements:
- Full Polish diacritics (ą ć ę ł ń ó ś ź ż).
- Ideally Cyrillic too, for a likely future UK locale.
- Tabular numerals.

**Decision (2026-11-19):** **Inter** (variable), self-hosted via `next/font`. Fonts, icons and other UI assets are never loaded from third-party CDNs at runtime ([ADR-0025](adr/0025-self-hosted-fonts-and-ui-assets.md)).

**Considered:** IBM Plex Sans (distinctive, but heavier and less neutral); the system font stack (zero bytes, but a different look per OS and no control over numeral width).

---

## 4. Accessibility target

**Decision (2026-11-19):** **WCAG 2.2 AA**, plus **AAA contrast (7:1)** for key information on the customer status and called screens ([ADR-0026](adr/0026-accessibility-target-wcag-aa-plus-aaa-status-contrast.md); ROADMAP question 19). Venue accent colors are adjusted to meet it (§2).

**Commitments:**
- Touch targets ≥ 44×44 px (customer) and ≥ 48×48 px (staff), well above the AA minimum of 24 px.
- Full keyboard support on admin.
- Screen-reader announcements (`aria-live`) for position changes and "called".
- No information conveyed by color alone.
- 200% zoom and text resize without loss.

**Verification:** axe in Playwright on CI, plus manual VoiceOver and TalkBack checks on key flows each stage.

**Considered:** AA only (status screens may be hard to read outdoors); AAA throughout (not achievable for all content, disproportionate effort).

---

## 5. Light / dark mode per surface

**Decision (2026-11-19)** (ROADMAP question 17):

| Surface | Decision |
|---|---|
| Customer | **Follow the system.** The called screen is always a full-bleed, high-contrast state whatever the mode |
| Staff | **Toggle on the device, with a venue default.** The default is a venue setting (F-VENUE-SETTINGS); the device choice overrides it. Dim restaurants favor dark and bright workshops favor light |
| Admin / operator | **Follow the system plus a toggle** |

Every token, including the venue `brand` accent, must be validated in both modes.

**Considered:** customer light only; staff following the system, a per-user preference (needs a profile setting and follows the person, not the tablet) or dark only; admin light only.

---

## 6. The "you're called" moment

This is the most important moment in the product, and the web platform constrains it.

| Constraint | Effect |
|---|---|
| iOS Safari has no Vibration API | No haptic alert on iPhones |
| Audio needs a prior user gesture (all browsers) | No sound unless the user has interacted with the page |
| Android Chrome `navigator.vibrate` also needs user activation | Vibration only works after a tap |
| Screen lock and backgrounded tabs throttle JS and suspend sockets | The page may not learn that the customer was called until it's foregrounded |
| Web Push on iOS requires a Home Screen install | Conflicts with "no install" |

**Decision (2026-11-19):** **an "Enable alerts" step plus an operational fallback** in v1 ([ADR-0027](adr/0027-called-moment-enable-alerts-and-staff-fallback.md); ROADMAP question 16). SMS in v1.1 is the real fix for locked phones.
- **Enable alerts:** a tap after joining unlocks audio (AudioContext) and vibration (Android), requests a **Screen Wake Lock** (keeps the screen on while visible; released when hidden; the customer can turn it off), and explains in plain language "Keep this page open; we'll alert you here".
- **Staff fallback signals:** staff see, per entry, whether alerts are enabled and when the customer was last seen online. This is connection state only, no PII. Staff call out names or phone the rest.
- **Come back by:** customers see a "come back by HH:MM" time based on the ETA.

**Called-screen design:**
- A full-screen color change (not color alone: add a large text "It's your turn" and an icon).
- The ticket number and where to go (counter or host stand).
- A sound, plus vibration where allowed (the sound itself: ROADMAP question 18, F-CALLED-EXPERIENCE).
- Repeated gentle re-alerts until the customer acknowledges ("I'm coming").
- On refocus, an immediate refetch before anything is rendered.

**Considered:** the enable-alerts step without fallback signals (no connection metadata shown to staff, but a locked phone is missed silently); passive only, with a visual state change, title flash and favicon badge (easy to miss).

---

## 7. Layouts for text expansion

Polish strings typically run 20–30% longer than English, and German (a possible future locale) is longer still.

**Decision (2026-11-19):** **flexible layouts + a pseudo-locale.** No fixed widths on text, buttons wrap or stack, no text baked into images, truncation only where the full text is still reachable. A dev-only pseudo-locale (accented and about 40% longer) runs in visual checks.

**Rules:**
- Test against the longest supported locale (PL, ROADMAP question 2) and the pseudo-locale.
- Customer names may contain diacritics and be long, so they wrap or truncate gracefully on the staff dashboard.
- ICU plurals for Polish (1 / 2–4 / 5+).

**Considered:** design per locale (doesn't scale); shortening copy to fit (breaks with every new language).

---

## 8. Mockups & review process

**Screens to mock up:**
- Join
- Status
- Called
- Staff dashboard (tablet, portrait and landscape)
- Queue configuration (venue admin)
- Venue settings
- QR poster (print, A4 and A5)

Hi-fi variants (F-DESIGN-MOCKUPS decision 4):
| Screens | Locales | Modes | Venue branding |
|---|---|---|---|
| Join, status, called | PL and EN | Light and dark | With and without |
| Staff dashboard (portrait and landscape) | PL and EN | Light and dark | None (product brand, [ADR-0023](adr/0023-venue-branding-logo-and-accent-color.md)) |
| Queue configuration, venue settings | PL, plus one EN artboard each | Light and dark | None |
| QR poster (A4, A5) | PL and EN | Print (light) | With and without the venue logo |

**Decision (2026-11-19)** (ROADMAP question 14): sequential, one pass per fidelity.
1. **Low-fi flow sketches** of join, status, called and the staff dashboard on a tablet: grey boxes with real PL/EN copy, no color or brand. They check steps, information and actions only, and are not approved as a design.
2. **Product brand** (name, logo, palette; ROADMAP question 15), in parallel with the sketches, since it doesn't depend on the flows.
3. **Hi-fi mockups in a design tool** of every screen above, built on the tokens in §3.2 and the product brand. They use the same tokens that F-DESIGN-SYSTEM puts in code.

**Where they live:** claude.ai artifacts, with the repo holding everything the code depends on ([ADR-0028](adr/0028-mockups-in-artifacts-with-the-repo-as-source-of-truth.md)).

**Review flow:** hi-fi mockups are published as private links → feedback → iterate → a short test with 2–3 venue staff and customers (or stand-ins from the product owner's network when no venue is available) → **explicit approval** by the product owner, recorded in the decision log below with links and dates.

**Mockups** (private claude.ai artifacts; approved 2026-11-20):
| What | Link | Version |
|---|---|---|
| Low-fi flow sketches (accepted 2026-11-19) | [notqueue low-fi flows](https://claude.ai/artifact/MFPp9nM3yKsqBJTjBPUyeE) | 10 |
| Product brand directions (B chosen 2026-11-19) | [notqueue brand directions](https://claude.ai/artifact/Xev8AmUXsEjAiMfkCuwxz2) | 7 |
| Design system reference | [notqueue design system](https://claude.ai/artifact/9697Y5HQEFTNeRETjUBkg1) | 2 (`1795088882-b177`) |
| Hi-fi mockups, all screens above plus enable alerts and walk-in | [notqueue hi-fi mockups](https://claude.ai/artifact/VVwQpFVRfcrK9xxbyjLEiU) | 13 (`1795089983-0be5`) |

**Considered:** low-fi and hi-fi fully in parallel (two sources of truth that drift, every change made twice); hi-fi straight away (polish distracts from the flow, layout changes cost more); Figma with a designer (cost and calendar time, a handoff gap to the code).

---

## Decision log

| Date | Section | Decision | Notes |
|---|---|---|---|
| 2026-11-19 | 1. Surfaces | Four surfaces and principles; customer budgets ≤ 100 KB JS, LCP < 2.5 s | F-DESIGN-DECISIONS |
| 2026-11-19 | 2. Branding | Venue logo + one accent color, contrast adjusted automatically | ADR-0023; ROADMAP question 13 |
| 2026-11-19 | 3.1–3.2 Components, tokens | shadcn/ui + Tailwind; two-layer `@theme` tokens with a runtime `brand` | ADR-0024 |
| 2026-11-19 | 3.3–3.4 Icons, fonts | Lucide; Inter, self-hosted; no third-party asset CDNs | ADR-0025 |
| 2026-11-19 | 4. Accessibility | WCAG 2.2 AA + AAA contrast on customer status and called screens | ADR-0026; ROADMAP question 19 |
| 2026-11-19 | 5. Light/dark | Customer: system; staff: device toggle with a venue default; admin: system + toggle | ROADMAP question 17 |
| 2026-11-19 | 6. Called moment | Enable-alerts step + staff fallback signals + "come back by" | ADR-0027; ROADMAP question 16 |
| 2026-11-19 | 7. Text expansion | Flexible layouts + pseudo-locale | |
| 2026-11-19 | 8. Mockups | Low-fi sketches → hi-fi in a design tool, product brand in parallel; owner approves after a user test | ROADMAP question 14 |
| 2026-11-19 | 2, 3.2 Product brand | Direction B, warm signal; "notqueue" final | ROADMAP question 15; F-DESIGN-MOCKUPS |
| 2026-11-20 | 8. Mockups | **Approved** by the product owner after the user test: [hi-fi mockups](https://claude.ai/artifact/VVwQpFVRfcrK9xxbyjLEiU) version 13, [design system](https://claude.ai/artifact/9697Y5HQEFTNeRETjUBkg1) version 2; token values in §3.2 | F-DESIGN-MOCKUPS |
