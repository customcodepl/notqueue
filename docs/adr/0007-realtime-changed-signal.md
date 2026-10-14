# ADR-0007: Supabase Realtime Broadcast as a "changed" signal

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** [ADR-0002](0002-hosting-and-database.md), [ADR-0004](0004-business-logic-in-own-api.md), [ADR-0006](0006-transactional-outbox.md), F-REALTIME

## Context
Customers and staff need live queue updates. Vercel functions cannot hold WebSocket connections. Payloads on a realtime channel can reach anyone subscribed to it, so they must not carry PII.

## Decision
The outbox dispatcher sends a small "changed" broadcast through Supabase Realtime: a private channel per venue for staff and a public channel per queue for customers. Clients then refetch through the API. Polling and refetch-on-focus are the fallback.

## Alternatives considered
- **Postgres Changes (row subscriptions):** sends row data to clients and bypasses the API layer.
- **Own WebSocket server:** not possible on serverless without extra infrastructure.
- **Pusher or Ably:** an extra vendor and data processor.

## Consequences
- **Positive:** no PII on the wire; one read path through the API; works with serverless.
- **Negative / accepted trade-offs:** every change costs an extra request per client; bursts need debouncing.
- **Follow-ups:** realtime sits behind an `infra` adapter so it can be replaced.
