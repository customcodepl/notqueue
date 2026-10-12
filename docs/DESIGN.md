# Design

> Status: **skeleton, awaiting decisions.** Each section lists options with a recommendation (✅). The final choice is the product owner's. When a decision is made, fill in **Decision** and remove the options you didn't pick (or move them to a short "Considered" note).

This document is the reference for every UI stage. The baseline definition of done in [ROADMAP.md](ROADMAP.md) requires each stage to match it.

---

## 1. Surfaces & user contexts

| Surface | Device | Context | Design principles |
|---|---|---|---|
| **Customer** (join, status, called) | Own phone, often in an in-app browser opened by a QR scanner | One-time use, no install, no login, possibly outdoors in sunlight, low attention, poor connection | One primary action per screen; minimal form; huge ticket number and position; high contrast; fast on slow networks; works with no account and no install; recoverable if the tab is closed |
| **Staff** (dashboard) | Tablet (portrait and landscape), sometimes a phone | Busy, noisy, wet or greasy hands, glanced at between other tasks | Glanceable at arm's length; the key facts (ticket, party size or service, wait time) are the largest elements; one-tap primary actions; **undo instead of confirm dialogs**; no hover-only UI; visible connection status |
| **Venue admin** | Desktop or laptop, sometimes a tablet | Occasional, deliberate configuration | Standard, dense-enough forms; clear save and validation states; per-language content editing; responsive down to tablet |
| **Platform operator** | Desktop | Internal and infrequent | Functional over polished; tables and forms from the shared component set |

**Customer-surface budgets (proposed):**
- JS ≤ 100 KB gzip on the public pages.
- LCP < 2.5 s on a mid-range phone over 4G.
- The page must work inside the iOS camera → Safari and Android Lens / in-app browser flows.
- Store the entry token locally so that re-scanning the QR code restores the status page.

**Decision:** _pending_

---

## 2. Product brand vs per-venue branding

The customer-facing screens show the venue's identity. Staff, admin and operator screens show the product brand.

| Option | Pros | Cons |
|---|---|---|
| A. Product brand only | Simplest, consistent, no contrast risk | Venues feel like they're sending customers to a third party; weaker trust at the QR moment |
| ✅ **B. Venue logo + one accent color** on customer screens, with a small "Powered by" product mark | Recognizable for the customer, cheap to build, contrast can be guarded automatically | Limited expressiveness |
| C. Full theming (palette, font, background image, custom domain) | Premium feel; a possible paid tier | Large design and QA matrix, accessibility risk, more support |

**Guardrails for B:**
- The accent color must pass a contrast check against the light and dark backgrounds. If it fails, derive a darker or lighter variant automatically, or reject it in the admin UI.
- The logo is shown in a fixed slot with max dimensions.
- Status colors (called, warning, error) are never overridden by brand colors.

**Decision:** _pending_

---

## 3. Design system

### 3.1 Component foundation
| Option | Pros | Cons |
|---|---|---|
| ✅ **shadcn/ui (Radix primitives) + Tailwind** | Code is copied into the repo and owned by us; Tailwind-native; token-driven via CSS variables; large ecosystem; accessible primitives | Its look is common; we maintain the copied components |
| React Aria Components (Adobe) | Best-in-class accessibility, plus i18n helpers (dates, numbers, RTL) | More verbose; styling takes more of our own work; smaller Tailwind ecosystem |
| Custom components from scratch | Full control | Slow; we'd have to solve accessibility ourselves |

**Decision:** _pending_

### 3.2 Design tokens
Proposal: Tailwind v4 `@theme` CSS variables in two layers.
- **Primitive tokens**: the palette and scales.
- **Semantic tokens**: `bg`, `fg`, `muted`, `border`, `primary`, `brand` (venue-overridable), and the statuses `waiting`, `called`, `served`, `no-show`, `danger`, `success`, `warning`.

| Category | Proposal (to be confirmed) |
|---|---|
| Color | Neutral gray scale plus one product primary; separate status colors; `brand` set per venue at runtime |
| Typography | A type scale with an extra-large **display** step for ticket numbers and positions; tabular numerals for numbers |
| Spacing | A 4 px base scale |
| Radius | A small set: `sm`, `md`, `lg`, `full` |
| Elevation | Minimal: borders before shadows |
| Motion | Short and functional; respects `prefers-reduced-motion` |

**Decision:** _pending_

### 3.3 Icon set
| Option | Pros | Cons |
|---|---|---|
| ✅ **Lucide** | shadcn default, consistent stroke style, tree-shakeable, broad coverage | Line-only style |
| Phosphor | Several weights (useful for emphasis), large set | Not the shadcn default |
| Heroicons | Tailwind-native, clean | Smaller set |

Icons always come with a text label on primary actions, since meaning varies across cultures.

**Decision:** _pending_

### 3.4 Fonts
Requirements:
- Full Polish diacritics (ą ć ę ł ń ó ś ź ż).
- Ideally Cyrillic too, for a likely future UK locale.
- Tabular numerals.
- Self-hosted via `next/font`, so no runtime requests to Google. This is a GDPR concern: loading Google Fonts from their CDN has been ruled unlawful in the EU.

| Option | Pros | Cons |
|---|---|---|
| ✅ **Inter** (variable) | Very legible at small sizes and on screens, Latin Extended and Cyrillic, `tnum` | Very common |
| IBM Plex Sans | Distinctive, Latin Extended and Cyrillic | Heavier, less neutral |
| System font stack | Zero bytes to download, native feel | Different look per OS, no control over numeral width |

**Decision:** _pending_

---

## 4. Accessibility target

| Option | Pros | Cons |
|---|---|---|
| ✅ **WCAG 2.2 AA**, plus **AAA contrast (7:1)** for key information on customer status and called screens | The industry baseline; aligned with the European Accessibility Act (EN 301 549); the stricter contrast addresses sunlight and glare | Some brand colors get adjusted |
| WCAG 2.2 AA only | The standard target, simpler | Status screens may be hard to read outdoors |
| WCAG 2.2 AAA | Maximum | Not achievable for all content; disproportionate effort |

**Commitments:**
- Touch targets ≥ 44×44 px (customer) and ≥ 48×48 px (staff), well above the AA minimum of 24 px.
- Full keyboard support on admin.
- Screen-reader announcements (`aria-live`) for position changes and "called".
- No information conveyed by color alone.
- 200% zoom and text resize without loss.

**Verification:** axe in Playwright on CI, plus manual VoiceOver and TalkBack checks on key flows each stage.

**Decision:** _pending_

---

## 5. Light / dark mode per surface

| Surface | Options | Recommendation |
|---|---|---|
| Customer | (a) follow the system, (b) light only | ✅ **Follow the system.** The called screen is always a full-bleed, high-contrast state whatever the mode |
| Staff | (a) follow the system, (b) toggle on the device with the default set by the venue, (c) dark only | ✅ **Toggle with a venue default.** Dim restaurants favor dark and bright workshops favor light |
| Admin / operator | (a) follow the system plus a toggle, (b) light only | ✅ **Follow the system plus a toggle** (it's cheap with shadcn tokens) |

Every token, including the venue `brand` accent, must be validated in both modes.

**Decision:** _pending_

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

**Mitigation options**

| Option | Pros | Cons |
|---|---|---|
| ✅ **A. An "Enable alerts" tap after joining**: unlocks audio (AudioContext) and vibration (Android), requests a **Screen Wake Lock** (keeps the screen on while visible), and explains in plain language "Keep this page open; we'll alert you here" | Uses everything the platform allows; honest | Battery cost from the wake lock (released when hidden, user can turn it off); still fails if the user locks the phone |
| B. Passive only: a visual state change, title flash and favicon badge | No permission friction | Easy to miss |
| C. A + **operational fallback**: staff see who has alerts enabled or is "last seen online" and call out names or phone numbers for the rest; customers see a "come back by HH:MM" time based on the ETA | Covers the locked-phone case without SMS | Needs staff process; shows connection metadata to staff |

**Recommendation:** A + C in v1. SMS in v1.1 is the real fix for locked phones.

**Called-screen design:**
- A full-screen color change (not color alone: add a large text "It's your turn" and an icon).
- The ticket number and where to go (counter or host stand).
- A sound, plus vibration where allowed.
- Repeated gentle re-alerts until the customer acknowledges ("I'm coming").
- On refocus, an immediate refetch before anything is rendered.

**Decision:** _pending_

---

## 7. Layouts for text expansion

Polish strings typically run 20–30% longer than English, and German (a possible future locale) is longer still.

| Option | Pros | Cons |
|---|---|---|
| ✅ **Flexible layouts + a pseudo-locale**: no fixed widths on text, buttons wrap or stack, no text baked into images, truncation only where the full text is still reachable; a dev-only pseudo-locale (accented and about 40% longer) runs in visual checks | Catches problems before real translations exist | A small setup cost |
| Design per locale | Pixel-perfect | Doesn't scale |
| Shorten copy to fit | Quick | Fragile; breaks with every new language |

**Rules:**
- Test against the longest supported locale.
- Customer names may contain diacritics and be long, so they wrap or truncate gracefully on the staff dashboard.
- ICU plurals for Polish (1 / 2–4 / 5+).

**Decision:** _pending_

---

## 8. Mockups & review process

**Screens to mock up (clickable HTML):**
- Join
- Status
- Called
- Staff dashboard (tablet, portrait and landscape)
- Queue configuration (venue admin)
- Venue settings
- QR poster (print, A4 and A5)

Each mockup shows PL and EN, light and dark (where the surface supports both), and the venue-branding variant.

| Option | Pros | Cons |
|---|---|---|
| A. **Claude-generated clickable HTML mockups** using the proposed Tailwind tokens | Fast and cheap to iterate; close to the real implementation (same tokens); reviewable on a real phone or tablet | Not a trained designer's eye; weaker for visual identity |
| B. **Figma, made by a designer** | Highest craft, a proper brand identity, standard handoff | Cost and calendar time; a handoff gap to the code |
| ✅ **C. Hybrid**: Claude HTML mockups for flows and screens, plus a designer (short engagement) for the product brand (name, logo, palette) and a polish review | Speed where speed matters, craft where it matters | Two inputs to reconcile |

Review flow: mockups are published as private links → feedback → iterate → **explicit approval** recorded in this document, with links and dates.

**Decision:** _pending_

---

## Decision log

| Date | Section | Decision | Notes |
|---|---|---|---|
| _empty_ | | | |
