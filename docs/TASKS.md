# Worvo — Build Tasks

**Status:** implementation not started. Follow the [canonical specification](IMPLEMENTATION_PLAN.md).

Check a task only with recorded implementation and verification evidence. Do not report a mock as a live integration.

## T00 — Check hardware and provider access

- [ ] Timebox the initial check to 20 minutes. Test wearable account/capture/retrieval, AI/transcription access, database access, and a delivery provider's sandbox/recipient/idempotency constraints.
- [ ] Record results in [SOURCES.md](SOURCES.md#integration-check-log). Confirm current event rules and deadline. Continue independent work when external access is unresolved.

## T01 — Scaffold and freeze contracts

- [ ] After T00 is attempted, scaffold the existing TypeScript/Next.js stack with pnpm; validate environment variables and reconcile `.env.example`.
- [ ] Define capture, proposal, invoice, approval, send-intent, error, and state schemas. Add capture, invoice review, and invoice list navigation.
- [ ] Acceptance: booting app, shared contracts, and real setup instructions in README.

## T02 — Persistence and synthetic seed

- [ ] After T01, add Drizzle migrations, Supabase Auth, organization checks, and the plan's minimum tables.
- [ ] Seed one business/owner, Juniper Cafe, work reference `WORK-104`, and confirmed labor/part prices from [DEMO.md](DEMO.md).
- [ ] Acceptance: reproducible seed and refresh-safe records; foreign-organization access rejected; reset is local-only.

## T03 — Invoice engine and review

- [ ] After T02, implement source/proposal persistence, revisioned corrections, deterministic pricing, detailed line items, exact-version approval, and idempotent confirmation.
- [ ] Acceptance: fixture produces a $225 invoice; unknown fields block approval; repeats add no lines; editing invalidates approval (A02–A07 as applicable).

## T04 — AI and real voice

- [ ] After T03, add bounded structured extraction, transcription, source-grounded descriptions, clarification, and short readback with button confirmation.
- [ ] Acceptance: real spoken description becomes the canonical invoice without typing work details; malformed output, microphone denial, and transcript instructions recover safely (A01, A03, A04, A06).

## T05 — Real wearable evidence

- [ ] After T00 access and T04, implement secure connection, narrow retrieval, source labels, and normalization through the same invoice path.
- [ ] Acceptance: A10 plus a repeated real-source retrieval check. Leave unchecked if hardware/account access is unavailable.

## T06 — Invoice output and sending

- [ ] After T03, generate printable/PDF invoices from the approved snapshot; implement the selected email adapter, confirmed recipient, explicit Send action, stable send intent, and provider receipt.
- [ ] Add pending, accepted, failed, and unknown result handling; protect against concurrent send clicks and reconcile ambiguous retries.
- [ ] Acceptance: exact approved content reaches a team-controlled test recipient with authorization; A07–A09 pass. A preview/download alone leaves this task incomplete.

## T07 — Verify and rehearse

- [ ] After T04/T06, run meaningful pricing, revision, permission, duplicate, and send-recovery checks plus one browser journey. Run the actual build/typecheck/lint scripts.
- [ ] Check public-demo authentication and disabled reset/identity bypass, or demonstrate locally.
- [ ] Rehearse [DEMO.md](DEMO.md) three times, prepare a labeled fallback recording, and report voice, wearable, and real-send results separately.
- [ ] Prepare accurate submission materials. Event submission and real customer messaging require their own authorization; this task only updates and pushes documentation.

## Time budget

Use the deadline linked in [Sources](SOURCES.md#s2-vexohacks-event), subject to organizer changes. Reserve the final 60 minutes for verification and rehearsal. Allocate the preceding time to capability checks (20 min), foundation/seed (50 min), invoice engine (60 min), real voice (60 min), wearable (30 min), and sending/output (45 min). If starting late, seed customer/rates and simplify visual polish; preserve invoice correctness and honest send status.

## Optional ownership when multiple agents are assigned

Backend owner: schemas, persistence, extraction, invoice calculations, approvals, delivery, invariant checks. Frontend owner: capture, invoice review/list, browser recording, and rehearsal. Agree on shared contracts first. Do not automatically spawn agents.
