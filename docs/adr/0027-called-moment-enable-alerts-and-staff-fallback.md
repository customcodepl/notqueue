# ADR-0027: The called moment: an enable-alerts step plus staff fallback signals

- **Status:** accepted
- **Date:** 2026-11-19
- **Related:** F-DESIGN-DECISIONS, F-REALTIME, F-CALLED-EXPERIENCE, F-STAFF-DASHBOARD, F-NOTIF-CORE, ROADMAP question 16, [ADR-0007](0007-realtime-changed-signal.md)

## Context
Being called is the most important moment in the product, and v1 has no SMS. Customers use a web page with no install, so iOS has no Web Push and no vibration, all browsers need a user gesture before playing sound, and a locked phone or a background tab suspends the page. Without help, a customer whose phone is locked misses the call, and staff can't tell which customers will.

## Decision
After joining, the customer is asked to tap "Enable alerts". The tap unlocks audio and, on Android, vibration, and requests a Screen Wake Lock while the page is visible. The page explains that it must stay open. Staff see, for each entry, whether alerts are enabled and when the customer's page was last seen online, so they know whom to call out by name or phone. These signals are connection state only and carry no PII. Customers also see a "come back by HH:MM" time based on the ETA. SMS in v1.1 is the fix for locked phones.

## Alternatives considered
- **The enable-alerts step without staff signals:** shows no connection metadata to staff, but a locked phone is missed silently.
- **Passive only** (visual state change, title flash, favicon badge): easy to miss.
- **Web Push:** on iOS it requires a Home Screen install, which conflicts with "no install".

## Consequences
- **Positive:** uses everything the platform allows; staff have a way to reach the customers it can't alert.
- **Negative / accepted trade-offs:** the wake lock costs battery while the page is visible; staff see connection metadata about customers; the customer page reports a heartbeat, which adds requests.
- **Follow-ups:**
  - F-CALLED-EXPERIENCE stores "alerts enabled" and a last-seen time per entry, updated by the customer page; it is anonymized with the entry and never sent in realtime payloads beyond the staff channel.
  - F-STAFF-DASHBOARD shows the signals; F-NOTIF-CORE leaves room for the SMS channel in v1.1.
