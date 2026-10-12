# notqueue

A multi-tenant SaaS for virtual queues and waitlists. Venues such as restaurants, car service shops and other service businesses use it to let customers wait without standing in line.

> Status: pre-1.0, Stage 0 (Foundations) in progress. See [Progress](docs/FEATURES.md#progress) and [docs/ROADMAP.md](docs/ROADMAP.md).

## Who it's for

| Actor | What they do |
|---|---|
| **End customer** (no account, usually on a phone) | Scans a QR code or opens a link, joins the queue, watches their live position and ETA, can leave the queue |
| **Venue staff** | Watches the queue live, calls customers, marks them served or no-show, adds walk-ins |
| **Venue admin** | Configures the venue (opening hours, queues, service types, languages) and manages staff accounts |
| **Platform operator** | Creates and manages tenants (organizations and their venues) |

A queue entry is generic. It is either a **party** (party size, e.g. a restaurant table) or a **service request** (service type, e.g. a tire change).

## Version 1.0

**In scope**
- Public join page and a live status page (mobile-first) showing position, ETA, "you're called" and leave.
- Real-time staff dashboard: call, call next, recall, served, no-show, remove, walk-ins.
- Venue admin: opening hours and exceptions, queues and service types, languages, staff management, printable QR poster.
- Operator console: organizations, venues, first-admin invitations.
- Multi-language from day one. The full UI is translatable (PL and EN at launch). Customers choose their language, the venue sets the default, and venue content (e.g. service names) has per-language versions.
- A pluggable notification layer. In v1 the status page is the only real channel.

**Out of scope for 1.0** (the architecture must not block these): SMS, table or time-slot reservations, payments and billing, native mobile apps, external integrations.

## Tech stack

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript, Tailwind CSS | Decided; one codebase for UI and API |
| Hosting | Vercel Pro, functions in `fra1` | No ops work, preview deploy per PR, EU region |
| Database | Supabase Postgres (`eu-central-1`) | Managed Postgres with RLS, same region as compute, self-hostable |
| ORM | Drizzle | SQL-first, light on serverless, RLS policies and roles declared in schema |
| Auth | Supabase Auth (staff, admins, operator) | Included, EU-hosted, JWTs usable by future native apps |
| Roles | Own `memberships` table plus a permission map in code | Portable, testable, independent of the auth vendor |
| API | Hono + `@hono/zod-openapi`, mounted at `/api/v1` | REST and an OpenAPI spec for mobile and integrations; can run standalone later |
| Validation | Zod | One schema for the API, forms and OpenAPI |
| Real-time | Supabase Realtime Broadcast ("changed" signal → refetch via API) | Works with serverless, no PII on the wire, logic stays in the API |
| i18n | next-intl (ICU messages) | Built for the App Router, handles Polish plurals |
| Date & time | `date-fns` + `@date-fns/tz` for timezone arithmetic; `Intl` via next-intl for display | Small and tree-shakeable (customer JS budget); Temporal can replace it once browser support allows |
| Background jobs | Outbox table + Next.js `after()` + Vercel Cron | Reliable delivery with no extra vendor |
| Testing | Vitest (unit and integration on real Postgres), Playwright (E2E) | Fast, and covers multi-browser realtime scenarios |
| Tooling | Node 24, pnpm, ESLint + Prettier, dependency-cruiser (layer boundaries), commitlint + husky (Conventional Commits) | Strict, automated checks that keep the layering and commit history consistent |
| CI/CD | GitHub Actions + Vercel Git integration | Gated DB migrations, then deploy |
| Monitoring | Sentry (EU host), uptime checks | Error tracking with PII scrubbing |
| SMS (v1.1) | SMSAPI.pl behind a channel adapter | Cheap, with good deliverability in Poland; Twilio as an international fallback |

## Architecture overview

- **Multi-tenancy.** The tenant is an **Organization**, which owns **Venues**, which own **Queues**. All tables share one schema and every tenant row has an `org_id`.
  - Isolation is enforced twice: by application-level scoping and by Postgres **Row-Level Security**. The API runs as a non-owner DB role with a transaction-local tenant context.
  - Operator access uses a separate, audited role.
  - Tables live in a schema (`app`) that is not exposed through Supabase's Data API.
- **API layer.** All business logic lives in our own versioned REST API (`/api/v1`). Clients never query Supabase directly.
  - The layering is `core` (pure domain) → `application` (use cases) → `infra` (DB, realtime, channels) → `api` / `app` (HTTP, UI).
  - The web UI uses the same API that native apps and integrations will use.
- **Real-time.** State changes write domain events to an **outbox** in the same transaction.
  - A dispatcher sends a small "changed" broadcast to Supabase Realtime: a private channel per venue for staff and a public channel per queue for customers.
  - Clients refetch through the API. Polling and refetch-on-focus are the fallback.
- **i18n.**
  - UI strings: per-locale message catalogs.
  - Venue content: `LocalizedText` JSON (`{"pl": "...", "en": "..."}`) that falls back to the venue default.
  - Customer locale resolution: explicit choice → browser language (if the venue enables it) → venue default. The locale is stored on the entry so future notifications use it.
  - Times are shown in the venue's timezone.
- **Notification layer.** Domain events (joined, called, near front, served…) go to the outbox, then a notification policy, then pluggable `NotificationChannel` adapters, and every delivery is logged.
  - v1 channels: status page (realtime), plus `log` and `fake_sms` for tests.
  - Adding SMS, email or push means adding an adapter, not rewriting anything.

- **Time handling.**
  - All instants are stored in UTC (`timestamptz`) and set by the database clock. The API exchanges ISO 8601 UTC strings and includes `serverTime` so clients don't depend on the phone's clock.
  - Each venue has an IANA timezone. Everything shown to people is formatted in that timezone.
  - Opening hours are local wall-clock times, so DST changes don't shift them.
  - A venue's day is a **business day** starting at a configurable hour (default 04:00), so a bar open 18:00–02:00 keeps one ticket sequence for the night.
  - The domain gets time from an injected `Clock`, which makes the state machine and ETA deterministic in tests.

## Data residency & GDPR

- All data is stored and processed in the EU: Vercel `fra1`, Supabase `eu-central-1`, Sentry EU. US-owned providers are covered by DPAs and SCCs/DPF.
- Each venue's organization is the **data controller**; the platform is the **processor**. We provide a DPA, a subprocessor list and a privacy notice template.
- **Minimization:** each venue chooses which contact fields are required, optional or hidden. No PII appears in realtime payloads, URLs, logs or error reports.
- **Retention:** customer PII is anonymized automatically after a per-organization period (default 30 days). Anonymized statistics are kept.
- Each venue's consent text version and timestamp are recorded per entry. There are tools for data export and erasure requests.
- End customers have no account. Access to an entry uses an unguessable token, and only its hash is stored.

## Future extensions

- **SMS notifications** (v1.1) through a new channel adapter and an opt-in consent.
- **Email and Web Push** as further channel adapters.
- **Native mobile apps** consuming the existing `/api/v1` with Supabase Auth JWTs.
- **Integrations** with external systems: per-tenant API keys and outgoing webhooks fed from the outbox.
- **Table and time-slot reservations**: `resources` and `bookings` entities that can convert into queue entries.
- **Payments and client billing**: subscriptions and plans on the organization, plus SMS usage metering.

## Development

Requires Node 24 (see `.nvmrc`) and corepack.

```
corepack enable
pnpm install                                  # also installs the commit-msg hook
pnpm exec playwright install chromium webkit  # once, for E2E
pnpm dev                                      # http://localhost:3000
pnpm check                                    # lint, typecheck, layer boundaries, unit tests
pnpm e2e                                      # Playwright on desktop, phone and tablet profiles
```

All scripts are listed in [CLAUDE.md](CLAUDE.md#commands).

## Documentation

- [docs/ROADMAP.md](docs/ROADMAP.md): delivery stages, definitions of done, open questions.
- [docs/FEATURES.md](docs/FEATURES.md): progress per stage, feature IDs and status, dependency graph, happy paths.
- `docs/features/<feature-id>/plan.md`: the approved plan of each feature, including its deviations.
- [docs/DESIGN.md](docs/DESIGN.md): surface principles, branding, design system, accessibility, the "you're called" moment, mockup process (decisions pending).
