# Roadmap

Every stage ends with a version that is **deployed** (Vercel preview or production), **tested** (CI green) and **demoable** (there's a scripted walkthrough on real devices).

Stages describe the **code track**. The **product track** runs in parallel from the start: design decisions and mockups (Stage 2: F-DESIGN-DECISIONS, F-DESIGN-MOCKUPS) and legal documents (F-LEGAL-DOCS). See "Next up" in [FEATURES.md](FEATURES.md).

The baseline definition of done has two levels. A check applies once the tool it needs exists. For example, "in CI" applies from F-FOUND-PIPELINE on, and before that the same checks run locally and the summary says so.

**Every feature** (checked when the feature is closed):
- **Quality**
  - Lint, typecheck, unit, integration (real Postgres with RLS) and E2E tests pass in CI.
  - Cross-tenant isolation tests cover all new endpoints (harness from F-TENANT-CORE, per-endpoint generation from F-AUTH-RBAC).
- **i18n**
  - All new UI strings exist in every enabled locale.
- **Design** (from Stage 2 onward)
  - UI matches [DESIGN.md](DESIGN.md) and the approved mockups (tokens, components, surface principles).
  - It meets the accessibility target in DESIGN.md: axe checks pass in Playwright.
  - It works with the longest supported language (and the pseudo-locale) without clipped or overlapping text.

**Every stage** (checked when the stage's last feature is closed):
- The demo script `docs/demos/stage-<n>.md` (steps, test data, expected results) has been run on the deployed preview.
- **Design** (from Stage 2 onward)
  - Key flows get a manual screen-reader pass.
  - The UI has been checked on real phone and tablet sizes (at least iOS Safari and Android Chrome, plus one tablet in portrait and landscape).

---

## Version 1.0

### Stage 0: Foundations
**Goal:** a deployable, tested skeleton.
**Scope:**
- Repository setup: strict TypeScript, Tailwind, linting and formatting, layer-boundary checks.
- Conventional Commits enforced with commitlint and a husky `commit-msg` hook.
- Vitest and Playwright.
- GitHub Actions pipeline, including PR-title validation against Conventional Commits; Vercel project (`fra1`) with preview deployments.
- Supabase staging and production projects (`eu-central-1`), plus a local Supabase stack.
- Drizzle schema `app` with the first migration, including the outbox table and a helper that writes a domain event in the caller's transaction (the dispatcher comes in Stage 4).
- Hono API at `/api/v1` with `/health` and the OpenAPI spec.
- next-intl with PL/EN, a missing-translation-key CI gate, and the `LocalizedText` type with its fallback resolver.
- Sentry (EU).

**Product owner prerequisites** (before F-FOUND-PIPELINE): a GitHub repository; a Vercel Pro team; Supabase staging and production projects in `eu-central-1`; a Sentry organization on the EU host; an uptime-check account. The exact list of secrets is in the F-FOUND-PIPELINE plan.

**Done when:** the deployed app switches PL/EN, `/api/v1/health` and the OpenAPI spec respond, CI is green, and every PR gets a preview URL.

### Stage 1: Tenancy, auth & operator console
**Goal:** a secure multi-tenant foundation.
**Scope:**
- Organizations, venues (basic), profiles, memberships, invitations, platform admins.
- Supabase Auth (email + password and magic link, custom EU SMTP); JWT verification in the API.
- Tenant-scoped transactions, RLS policies and DB roles; the cross-tenant isolation test harness (two seeded tenants).
- Operator console: create an organization and venue, invite the first admin. Invitation acceptance.
- Audit log.

The operator and login screens here use unstyled default components. They are aligned with the design system in a later stage.

**Done when:** the operator creates a tenant, its admin accepts the invite and logs in, and the admin sees only their own organization. An automated suite proves that a second tenant's data is inaccessible through every endpoint.

### Stage 2: Design foundations
**Goal:** deliberate, documented design decisions and approved mockups before any product UI is built.
**Scope:**
- **User contexts and principles per surface:** customer (phone, one-time, no install, outdoors, low attention), staff (tablet, busy, glanceable, large touch targets), venue admin and operator (desktop).
- **Branding:** the product brand vs per-venue branding (logo, accent color) on customer-facing screens, with contrast guardrails.
- **Design system:**
  - component foundation;
  - design tokens (color, typography, spacing, radius, motion) implemented as Tailwind theme variables;
  - icon set;
  - self-hosted fonts with full Polish diacritics.
- **Accessibility target** (proposed: WCAG 2.2 AA, plus AAA contrast for key customer status information).
- **Light/dark mode** policy per surface.
- **The "you're called" moment:** handling of browser constraints (no Vibration API on iOS Safari, audio needs a prior user gesture, screen lock and backgrounded tabs) with the chosen mitigations, and the operational fallback for staff.
- **Layouts that tolerate text expansion**, plus a dev pseudo-locale.
- **Clickable HTML mockups** for review: join, status, called, staff dashboard (tablet, portrait and landscape), queue configuration, venue settings, QR poster. Each in PL/EN, light/dark where applicable, and with a venue-branding variant.
- Tokens and base components added to the codebase. Stage 1 screens are restyled with them.

**Done when:** the design principles, tokens and component choices are documented in [DESIGN.md](DESIGN.md) with every decision filled in, the mockups have been reviewed and **approved by the product owner** (recorded in the DESIGN.md decision log), and the token and component foundation is in the codebase with the baseline design checks wired into CI.

### Stage 3: Queue core & customer journey
**Goal:** a customer can join and track a queue.
**Scope:**
- Queues, service types (minimal), queue entries, ticket numbering per business day, entry event history.
- Domain state machine, routing (party size or service type → queue) and the baseline ETA, all with unit tests.
- Venue admin, first screens: the venue's enabled locales and default locale; queues and service types CRUD with per-language content.
- Mobile-first join page (QR-friendly URL) with a consent checkbox and a language switcher, following the approved mockups. A basic per-IP rate limit and idempotency keys on the join endpoint.
- Status page (polling for now) and a leave action. The entry token is stored locally, so reopening the join link restores the status page.

**Done when:** an admin enables PL and EN for a venue and creates a queue with a service type; then, on a phone, a user opens the venue's join link, joins as a party of 4, sees their ticket number, position and ETA, and leaves. E2E tests cover the flow, and the screens match the approved mockups.

### Stage 4: Staff dashboard & real-time
**Goal:** live queue operations.
**Scope:**
- Staff dashboard: active entries per queue; call, call next, recall, served, no-show, remove, return to queue; walk-in form; highlighting of overdue calls; undo for destructive actions; connection indicator.
- Optimistic concurrency.
- Outbox dispatcher (the table exists from Stage 0); Vercel Cron infrastructure and an outbox sweep for undelivered events; Supabase Realtime Broadcast (private venue channel for staff, public queue channel for customers); polling fallback.
- The `NotificationChannel` interface, with the status page as its first channel.
- The "you're called" experience as designed in Stage 2: enable-alerts step, sound, vibration where supported, wake lock, re-alerts, acknowledgement.
- ETA based on observed throughput.

**Done when:** a staff member calls a customer on a tablet and the customer's phone shows the called state within about a second. A two-browser E2E test covers this. A concurrency test proves that two staff can't call the same entry. The called flow has been verified on a real iPhone and a real Android phone.

### Stage 5: Venue admin
**Goal:** venues configure themselves without operator help.
**Scope:**
- Venue settings: timezone, business day start, contact-field policy, privacy notice URL, branding (logo and accent color with a contrast check).
- Opening hours and exceptions. Joining is blocked while the venue is closed.
- Staff management: invite, role, venue scope, disable.
- Printable QR poster.

**Done when:** an admin configures and brands a restaurant from scratch and prints the QR poster, and a closed venue rejects joins with a localized message.

### Stage 6: Notification layer & i18n completeness
**Goal:** a pluggable notification layer, and the product fully usable in every launch language.
**Scope:**
- Notification policy, per-locale templates and a delivery log, on the `NotificationChannel` interface from Stage 4.
- A `fake_sms` channel that proves the plug-in path.
- Notification-specific retries (on top of the Stage 4 outbox sweep).
- A "near the front" event.
- Full PL/EN pass over all screens; a language change mid-wait is saved on the entry (the switcher itself exists from Stage 3); fallbacks for venue content.

**Done when:** a customer switches language mid-wait and the status page and the (fake) notifications follow it, the notification log shows deliveries per channel, and a full content pass confirms every screen and email is translated in every launch locale.

### Stage 7: Hardening, GDPR & pilot handover → **v1.0.0**
**Goal:** production-ready for the first client.
**Scope:**
- PII retention and anonymization job; tools for data export and erasure requests.
- Full abuse protection on the public endpoints (bot protection, active-entry caps), on top of the basic rate limit from Stage 3.
- Security headers and CSP; a security review.
- An accessibility audit against the target in DESIGN.md.
- Load test of a busy evening: about 150 live status pages and 5 staff.
- Point-in-time recovery enabled on production; backup restore drill, alerting, and a runbook (deploy, rollback, migrations, incidents).
- DPA, subprocessor list and privacy notice templates.
- Basic venue stats: served, average wait, no-show rate.

**Done when:** the restaurant is live on production; the load test, the restore drill and the accessibility audit pass; the legal documents are ready; and `v1.0.0` is tagged.

---

## After 1.0

| Item | Summary |
|---|---|
| **v1.1: SMS notifications** | SMSAPI.pl channel adapter, phone opt-in consent, delivery-report webhook, per-organization usage metering |
| Email & Web Push | Additional channel adapters; push requires a PWA install on iOS |
| Shared station accounts | Device-bound login for host-stand tablets |
| Venue display screen | A "Now calling" board for a TV at the venue |
| Native mobile apps | Consume `/api/v1`; Supabase Auth JWT as a Bearer token |
| Integrations | Per-tenant API keys, outgoing webhooks from the outbox, public API docs |
| Reservations | `resources` (tables, bays) and `bookings` that convert into queue entries |
| Payments & billing | Subscriptions and plans per organization; SMS usage billing |
| Analytics | Historical reports and exports per venue |

---

## Open questions & pending decisions

Each question names the features whose plan must not be approved until it's answered (**Blocks**). Questions marked "none in v1" don't block anything.

### Product & technical
1. **Team size.** The plan assumes a solo developer (a single app with enforced module boundaries). A team may want stricter conventions or a monorepo. **Blocks:** none in v1 (solo assumed).
2. **Launch languages.** **Resolved 2026-10-11:** PL + EN in 1.0. More locales can be added later without architecture changes. The longest supported language for design checks is PL, plus the pseudo-locale.
3. **Queue model.** The plan assumes several queues per venue, with routing by party size or service type. Should a single queue with staff choosing whom to call be supported as well? **Blocks:** F-QUEUE-MODEL.
4. **Required contact fields.** With no SMS in v1, is phone required, optional or hidden by default? **Blocks:** F-TENANT-CORE (the default), F-QUEUE-JOIN.
5. **Staff login on shared devices.** Are individual accounts enough for 1.0, or is a host-stand tablet mode needed? **Blocks:** F-AUTH-LOGIN.
6. **ETA method.** Is the throughput-based estimate with a configured fallback acceptable, or does the first client need per-service durations from day one? **Blocks:** F-QUEUE-MODEL (baseline ETA), F-QUEUE-ETA.
7. **Retention period.** Is 30 days the right default before PII is anonymized? It should be confirmed with the first client and legal counsel. **Blocks:** F-PLATFORM-CONSOLE (the default), F-GDPR-DATA.
8. **Bot protection.** Use Cloudflare Turnstile on the join form, or rely on rate limits only? **Blocks:** F-ABUSE-PROTECT, F-SEC-HARDENING (CSP).
9. **Backups.** **Resolved 2026-10-11:** daily backups of the Supabase Pro plan until go-live; point-in-time recovery is enabled in F-RELEASE-READINESS, before any real customer data.
10. **Domains.** **Resolved 2026-10-11:** one shared domain with venue slugs in the path. Subdomains or custom domains per venue are a possible later (paid) extension.
11. **Pricing model.** Not needed for 1.0, but it affects usage metering (per venue, per entry, per SMS). **Blocks:** none in v1.
12. **SMS provider.** Confirm SMSAPI.pl before starting v1.1. **Blocks:** none in v1 (v1.1).

### Design
13. **Per-venue branding depth.** Product brand only, logo + accent color, or full theming? Should deeper branding be a paid tier later? **Blocks:** F-DESIGN-DECISIONS, F-VENUE-BRANDING.
14. **Design process.** Claude-generated HTML mockups, Figma with a designer, or a hybrid? Who signs off, and is a test with real venue staff and customers part of the approval? **Blocks:** F-DESIGN-DECISIONS, F-DESIGN-MOCKUPS.
15. **Product brand identity.** Is "notqueue" the final name? Who designs the logo and the product palette? **Blocks:** F-DESIGN-SYSTEM.
16. **"You're called" fallback.** Should staff see whether a customer has alerts enabled or was recently online (connection metadata), so they know when to call out a name or phone the customer? **Blocks:** F-DESIGN-DECISIONS, F-CALLED-EXPERIENCE.
17. **Staff dark mode default.** Should it be set per venue, per device or per user? **Blocks:** F-DESIGN-DECISIONS.
18. **Called-screen sound.** A custom sound or a system-like tone, and should venues be able to choose? **Blocks:** F-CALLED-EXPERIENCE.
19. **Accessibility beyond AA.** Is the AAA contrast target for customer status screens accepted, given that it may adjust venue brand colors? **Blocks:** F-DESIGN-DECISIONS.
