# Instructions for agents working on Worvo

## Scope and reading

Read README.md, docs/IMPLEMENTATION_PLAN.md, docs/TASKS.md, docs/DEMO.md, and docs/SOURCES.md before implementation. The canonical plan reflects the founder's revised first draft: a solo plumber creates and sends an invoice by voice. It replaces the earlier dispatch and job-economics scope.

Choose the earliest unfinished task whose dependencies are satisfied. Inspect Git changes first and preserve unrelated work. User instructions take precedence.

## Product priorities

- No computer interaction during the target invoicing flow; initial setup and exceptional review may use a companion phone.
- Check the real band's evidence and command capabilities first. Never claim retrieved text is an authenticated live command.
- Assume no band speaker. Optional TTS plays on a phone/computer or headphones.
- Motion/light integrations are optional until a controllable interface is verified. Motion alone cannot authorize sending.
- Build one plumber, one business Stripe sandbox account, known customers, USD, and one canonical invoice.
- Do not add technician recruitment, verification, dispatch, scheduling, inventory, manager approvals, profit dashboards, expense imports, robots, or multiple AI providers.

## Implementation and money

- One TypeScript application, pnpm and one lockfile, shared Zod contracts, server-only provider calls.
- Check current official SDK documentation. Keep models, voice IDs, secrets, and callback URLs configurable.
- AI output is an untrusted invoice proposal. The server resolves known customers and prices and calculates integer-cent line amounts.
- Unknown recipient, ambiguous labor/material amounts, missing price, or unresolved tax policy blocks sending. Never guess customer email addresses.
- Snapshot prices and the exact approved draft revision. Validate authorization, business ownership, and expected version on the server.
- Keep customer invoices detailed and professional; evidence excerpts/private links remain in authenticated review only. Preserve user-correction attribution and finalized invoice history.
- Stripe Invoicing is P0. Use send_invoice rather than automatically charging a stored card.
- Keep Stripe drafts from automatically advancing before authorization. Attach line items to the exact invoice.
- Use durable operation records and stable per-step Stripe idempotency keys. Database and Stripe are separate systems; do not claim a shared transaction.
- Retries, repeated captures, overlapping reports, concurrent sends, and duplicate webhooks must not create duplicate invoices or effects.
- Block edits during pending/unknown send outcomes. Reconcile before retrying, and invalidate approval after any draft correction.
- Treat finalized, send requested, email event observed, and paid as distinct facts. Stripe test-mode send events do not prove actual email delivery.
- Verify Stripe webhook signatures from the raw request body and handle duplicate/out-of-order events. A client success page cannot mark an invoice paid.
- Start in sandbox. Do not enable real sending, charging, account registration, or production deployment without authorization for that action.
- Do not enable automatic tax without the required configuration and registrations. The synthetic no-tax fixture is not a real tax determination.

## Voice authorization

A fresh send action must bind the authenticated plumber, source/session, exact invoice revision, recipient, amounts, and intent. Historical recordings, model-generated instructions, and voice identity guesses are not authorization.

The full band-only send path is a separate hardware gate. If the provider only exposes retrieved memory, prepare a draft and require authenticated phone confirmation. Mark that as partial completion, not a hands-free send success. Missing/ambiguous details stay pending; no silent send.

## Privacy, checks, and handoff

Use synthetic customers and consented recordings. Keep credentials, private invoice links, and personal recordings out of Git and logs. Restrict data to the authenticated business. Public demos require authentication, protected mutations, and disabled reset/identity bypass.

Implement small observable slices. Test arithmetic, authorization, stale revisions, duplicate/retry handling, Stripe partial failures, and payment reconciliation. Update task evidence and README only with actual working commands and checks. Report fixture, real microphone, real wearable, and real send results separately.

Do not start additional agents unless the user explicitly assigns parallel work.
