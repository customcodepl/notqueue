# ADR-0006: Transactional outbox for domain events

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** [ADR-0007](0007-realtime-changed-signal.md), F-EVENTS-OUTBOX, F-NOTIF-CORE

## Context
State changes (joined, called, served) must reliably trigger realtime signals, notifications and, later, webhooks. Publishing directly after a commit can lose events if the function dies in between; publishing before the commit can announce changes that roll back.

## Decision
State changes write a domain event to an outbox table in the same transaction. A dispatcher delivers events, triggered by Next.js `after()` right after the request and by Vercel Cron as a sweeper for anything missed.

## Alternatives considered
- **Direct publish from use cases:** loses or invents events on failure.
- **Message queue (e.g. QStash, SQS):** an extra vendor and data processor for a volume Postgres handles easily.
- **Postgres logical replication or triggers:** ties delivery to Supabase internals and is harder to test.

## Consequences
- **Positive:** at-least-once delivery with no extra vendor; one source for realtime, notifications and future webhooks.
- **Negative / accepted trade-offs:** consumers must be idempotent; delivery after a failure waits for the next cron run.
- **Follow-ups:** outbox payloads contain no PII; deliveries are logged.
