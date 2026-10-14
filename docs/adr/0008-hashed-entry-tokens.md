# ADR-0008: Unguessable entry tokens, stored hashed

- **Status:** accepted
- **Date:** 2026-10-11
- **Related:** F-QUEUE-JOIN, F-QUEUE-STATUS, F-GDPR-DATA

## Context
End customers have no account. Their status page and actions (such as leaving the queue) must be reachable only by them. A database leak must not let anyone take over live entries.

## Decision
Each entry gets a high-entropy random token, returned to the customer once. Only a hash of the token is stored, and lookups compare hashes.

## Alternatives considered
- **Sequential ticket number or entry ID in the URL:** guessable.
- **Token stored in plain text:** a leak exposes every active entry.
- **Customer account or OTP login:** too much friction for a queue join.

## Consequences
- **Positive:** a database leak exposes no usable tokens; no account needed.
- **Negative / accepted trade-offs:** a lost token cannot be recovered from the database.
- **Follow-ups:** tokens never appear in logs or Sentry.
