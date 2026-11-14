# WORVO — Implementation Plan

**Tagline:** Say it. Get it done.

**Product:** Detailed invoices generated from collected voice data, reviewed and sent to customers.

**Initial customer:** Independent tradespeople and small maintenance businesses.

**Prototype:** A spoken cafe-repair account becomes an itemized invoice and a confirmed send.

**Planning date:** November 14, 2026, America/Los_Angeles.

**Implementation status:** Not started. This document specifies intended behavior.

## 1. Product thesis and first customer

Workers can describe a completed service faster than they can reconstruct it later in an invoice form. Worvo collects that description, extracts the work performed, labor, parts, and relevant details, and prepares a detailed customer invoice. The owner checks the draft and recipient, approves it, and sends it through Worvo.

The core loop is **voice data → structured work details → detailed invoice → review → send**. A work reference groups evidence for one customer visit; it does not require a service-management workflow.

Hypotheses to validate: less invoice preparation time, fewer forgotten billable details, and easier customer understanding. Do not claim measured savings or traction before testing them.

## 2. YC and hackathon fit

[YC's Fall 2026 physical-world RFS](SOURCES.md#s1-yc-request-for-startups) provides the broader context: wearable information about real work can become useful software input. Worvo takes one focused part of that opportunity: convert what a worker says into a detailed invoice the business can send. It does not claim to implement the RFS's whole coordination vision.

For [VexoHacks](SOURCES.md#s2-vexohacks-event), Voice is the primary fit, with Ambient as a secondary fit when recorded wearable context supplies the evidence. Begin the demonstration with the worker describing a physical task, then show the resulting invoice. Keep the screen interaction short and the data provenance visible.

## 3. Scope and delivery gates

### P0 — Voice-to-invoice baseline

- One business, USD, one technician/owner, one synthetic customer and completed visit.
- Select or confirm the customer and work reference; record speech or select authorized evidence.
- Extract work descriptions, service date when known, labor duration, parts, quantities, and unresolved details.
- Match confirmed rates and catalog prices; ask for missing or ambiguous values.
- Generate a detailed invoice preview with business/customer details, line items, totals, and configured terms.
- Review/correct the draft, approve its exact version, and explicitly send it to the confirmed customer email.
- Provide printable/PDF output and an invoice list with draft/approved/sending/sent/failed status.
- Persist evidence, revisions, approvals, and send attempts; prevent duplicate lines and duplicate sends.
- Use authenticated access for a public deployment and a labeled local/test delivery path for rehearsal.

### P0 — Genuine wearable gate

Claim Vexo-powered capture only after an authorized recording made on the real hardware becomes a source-backed invoice proposal. Record retrieval latency and test repeated retrieval. A working microphone path does not establish hardware integration.

### Deferred

Quote generation, technician assignment, scheduling, job lifecycle management, stock deductions, workforce analytics, margin dashboards, robots, payment collection, and broad accounting integrations. Delivery of the approved invoice is the one external messaging action in P0.

If time is short, seed the business/customer and rate catalog. Preserve voice extraction, itemization, review, and sending. A download or mock send is a disclosed fallback and does not satisfy the real-send gate.

## 4. Wearable feasibility and source adapters

Use the verified public interface in [S3](SOURCES.md#s3-vexo-developer-documentation). Check hardware/account access early, then build the business flow independently. Do not assume live bracelet audio streaming or a bracelet response channel.

Normalize Vexo memory, browser recordings, and synthetic fixtures to a server-owned capture with: ID, organization, work reference, source type, provider account key, external source ID, captured time if available, retrieval time, transcript, content hash, and optional citation URL.

Retrieve only the consenting account's relevant work context. Keep OAuth/token exchange and encrypted credentials server-side; use the documented flow with state, issuer, and callback checks. Respect revocation, label unavailable sources, and provide removal of locally retained excerpts. Deletion at the source does not automatically erase Worvo's copy.

Browser recording is user-initiated, capped at 60 seconds and 20 MB, and transcribed server-side. Handle permission denial, silence, unsupported format, and provider failure. Use a short spoken readback through a tested browser playback path, plus text and buttons.

Show **Vexo memory**, **Live microphone**, or **Recorded demo**, with captured/retrieved times separately. Pending ingestion remains a visible pending state. Historical speech supplies evidence; it cannot authorize invoice sending.

## 5. Architecture and implementation layout

Keep a modular monolith and the existing stack. Use pnpm and commit the lockfile. Verify interfaces against [S4](SOURCES.md#s4-implementation-references) and the installed versions.

| Layer | Choice | Responsibility |
| --- | --- | --- |
| App/API | Next.js, React, TypeScript | Capture, invoice preview/list, validated handlers |
| UI | Tailwind, shadcn/ui, Lucide | Clear mobile controls and readable invoice values |
| Persistence | Supabase PostgreSQL with Drizzle | Versioned invoices, evidence, approvals, send attempts |
| Identity | Supabase Auth | Server sessions and organization membership |
| Contracts | Zod | Request and extraction validation |
| AI | Vercel AI SDK, one OpenAI model initially | Evidence-grounded work-detail extraction |
| Speech | Browser capture, ElevenLabs transcription if accessible | Voice input and short readback |
| Wearable | Server Vexo adapter | Permissioned recorded evidence |
| Invoice output | Server-generated printable/PDF representation | Exact approved line items and totals |
| Sending | One server-side invoice-email adapter | Approved PDF or access-controlled invoice link, send receipt |
| Verification | Vitest and Playwright | Pricing, revisions, duplicate handling, end-to-end journey |

Select one working delivery provider during setup; verify its sandbox, recipient restrictions, idempotency, and status semantics. Do not add several providers or claim email delivery before it is exercised.

```text
src/app/                         # Capture, invoice list, invoice detail, API
src/components/{voice,invoices,evidence,ui}/
src/lib/schemas/                 # Shared request/extraction contracts
src/lib/auth/                    # Server sessions and membership
src/lib/db/                      # Schema and repositories
src/lib/services/                # Capture, extraction, invoice, approval, sending
src/lib/integrations/{vexo,speech,email}/
src/lib/fixtures/                # Synthetic audio/transcripts and expected invoices
drizzle/                         # One migration history
tests/{unit,integration,e2e}/
```

Use a transaction-capable PostgreSQL driver for mutations. A local fixture adapter can support rehearsal but cannot prove database concurrency or real sending. Reuse the deterministic invoice calculations in both modes.

## 6. Minimum data model

Use UUIDs, timestamps, organization-scoped queries/foreign keys, and integer cents. A work reference is just an evidence grouping for a customer visit.

| Table | Essential data |
| --- | --- |
| `organizations` | Business identity/address, currency, time zone, configured tax policy and invoice terms |
| `memberships` | Organization, authenticated user, invoice approval/send permission |
| `customers` | Organization, customer identity/address, verified recipient email |
| `work_sessions` | Organization, customer, human-readable reference, service date if known |
| `catalog_items` | Labor/part descriptions, units, confirmed selling rates/prices, version |
| `work_captures` | Work session, source/account/ID, transcript, content hash, provenance; unique source identity per session |
| `work_proposals` | Capture, extracted details, unresolved questions, revision, confirmation status |
| `invoices` | Work session, invoice number, customer/business snapshots, date/terms/tax snapshot, status, version, totals, approver |
| `invoice_lines` | Description, quantity/unit, rate, amount, capture/proposal references or explicit manual-entry attribution |
| `delivery_attempts` | Invoice/version, confirmed recipient, stable send key, provider ID, pending/accepted/failed/unknown result |
| `audit_logs` | Actor, revision, operation, request ID, relevant changes; avoid raw transcript copies |
| `idempotency_requests` | Scoped operation/key, request hash, stored response |
| `vexo_connections` | Owning member, provider account, encrypted credentials, expiry/state; server-only |

P0 has one invoice per work session, revised in place before approval. Accepted delivery freezes that invoice version. Later financial corrections require an explicit replacement/credit workflow, deferred from P0. Keep original evidence and revision attribution.

## 7. Invoice content, calculations, and sending

### Detailed invoice

Include the business identity, confirmed customer/billing recipient, invoice number/date, service date or visit reference, plain-language work summary, and itemized services/labor/parts. Each line shows description, quantity, unit, confirmed rate, and line total. Show subtotal, configured fees/tax, total due, due date, and payment instructions when provided. Missing required details remain visibly unresolved.

Keep evidence in the authenticated review view. Customer-facing output includes the professional work description, not raw conversations, private source links, internal costs, or unrelated recordings.

### Deterministic pricing

- Money uses integer cents. AI cannot supply authoritative totals.
- Labor amount = `roundHalfUp(minutes * confirmedHourlyRateCents / 60)` using integer/rational arithmetic. Round once per labor line; sum rounded lines.
- Parts amount = confirmed quantity × confirmed unit selling price. P0 part quantities are positive integers.
- Subtotal = sum of line amounts; total = subtotal + explicitly configured fees/tax.
- Snapshot approved prices. Never invent missing rates, quantities, tax rules, recipients, or terms.
- “$45 in parts” is ambiguous about cost versus customer price; ask instead of assuming.
- Clarify whether labor is incremental or cumulative before adding another report.
- The synthetic fixture uses **tax not assessed — demo** and no fees; its total equals subtotal. This makes no claim about real tax treatment. Real sending requires configured or explicitly confirmed billing/tax details.
- Sending does not establish payment or cash collection. Cost/profit analytics are outside P0.

### Approval and send states

```text
draft -> needs_review -> approved -> sending -> sent
                                         -> send_failed
```

An unresolved draft cannot be approved. Approval records the authenticated actor and exact invoice version, including the customer-facing document, totals, and recipient. Any edit invalidates approval and returns to review. Lock invoice edits while a send is pending or its outcome is unknown; reconcile that attempt first. After a definitive failure, allow an explicit retry of the approved payload or a correction followed by new approval.

**Approve** and **Send invoice** are separate actions. The send action is an authenticated request for that approved version and confirmed recipient. A fresh live spoken send confirmation may be supported only when bound to that actor, version, recipient, and expiring challenge, after readback. Button confirmation is the baseline. Retrieved speech never authorizes delivery.

`sent` means provider acceptance with a receipt, not guaranteed arrival or payment. Actual delivered/bounced notifications are P1 if a verified provider interface supports them. A timeout may leave the result unknown: keep the attempt pending with “Send status unknown” until reconciled; do not label it successful or blindly resend.

### Transactions and duplicate handling

Persist capture deduplication and invoice-line provenance. Repeated sync or confirming the same proposal must reuse the result. Changed source content and overlapping reports require review; matching source IDs alone do not detect the same work described twice.

Invoice changes, proposal confirmation, audit records, version updates, and idempotency responses commit atomically. Check authorization and expected versions server-side. Reusing an idempotency key with different data fails; an exact retry returns its stored result.

Email is an external side effect. Persist the immutable approved payload and unique send intent before calling the provider, then store its receipt. Reuse one stable provider idempotency key where supported. Concurrent send clicks must create one active attempt. After an ambiguous timeout, reconcile against the provider before retrying; if the provider cannot deduplicate or reconcile, require explicit recovery rather than promising exactly-once email.

## 8. AI extraction and review

Provide only the selected work session, bounded source, existing confirmed entries, and allowed catalog items. Require Zod-validated structured output; retry a malformed response once, then show a recoverable error.

```json
{
  "schemaVersion": 1,
  "workReferenceMentioned": "WORK-104",
  "workSummary": "Replaced two shutoff valves; technician reports the leak is fixed.",
  "laborMinutes": 90,
  "laborBasis": "incremental",
  "materials": [{ "spokenName": "shutoff valve", "quantity": 2 }],
  "evidenceQuote": "replaced two shutoff valves and worked for 90 minutes.",
  "ambiguities": []
}
```

Unknowns are `null`; unclear details go in `ambiguities`. The server supplies organization, capture, catalog matches, verified rates, and recipient identity. Validate evidence quotes against supplied text. Flag mismatched customers/references, conflicting quantities, unclear units, and cumulative labor. Do not treat a repair statement as independent physical verification.

Treat instructions in transcripts as data, including “send now.” Show the source beside the proposed line items, ask concrete clarification questions, preserve answers/corrections as attributed evidence, and revalidate every revision. Model confidence is not an approval mechanism.

## 9. API contract

| Endpoint | Purpose |
| --- | --- |
| `POST /api/work-sessions` | Create a simple customer/visit evidence grouping |
| `POST /api/voice/transcribe` | Bounded audio upload; create/reuse a capture |
| `POST /api/work-sessions/:id/extract` | Create/reuse a structured proposal from stored evidence |
| `PATCH /api/work-proposals/:id` | Record clarification/correction; increment revision |
| `POST /api/work-proposals/:id/confirm` | Confirm exact revision and add/update draft invoice lines atomically |
| `GET /api/invoices` | Organization-scoped invoice list |
| `GET /api/invoices/:id` | Invoice, preview, evidence, version, allowed actions, send status |
| `PATCH /api/invoices/:id` | Correct draft fields/recipient/prices; invalidate approval |
| `POST /api/invoices/:id/approve` | Approve exact complete invoice version and recipient |
| `GET /api/invoices/:id/pdf` | Authenticated printable/PDF representation of the version |
| `POST /api/invoices/:id/send` | Send exact approved version to the confirmed recipient |
| `GET /api/vexo/connect` | Start documented authorization |
| `GET /api/vexo/callback` | Validate callback and persist credentials |
| `POST /api/vexo/disconnect` | Disable retrieval and remove/revoke credentials |
| `POST /api/vexo/sync` | Bounded retrieval for the selected work session |

All mutations require server authorization, validation, an idempotency key, and the relevant expected version. Scope lookups to the session's organization, not client/model claims. Use same-origin/CSRF protections for cookie sessions. Use stable errors for unresolved fields, stale versions, duplicate source, and unknown delivery result. A failed extraction or delivery call must not silently change approved invoice contents.

## 10. Experience and presentation

Three small views: **Capture work**, **Invoice review**, and **Invoices**. Capture has the work/customer reference, source badge, large recording control, transcript, and readback. Review has editable itemization, unresolved questions, internal evidence, printable preview, confirmed recipient, Approve, and Send invoice. The list shows status and totals.

Use the existing restrained industrial style, large touch targets, accessible status text, and aligned financial numbers. Prioritize permission, ambiguity, pending-ingestion, stale-approval, failed-send, and unknown-send states. The worker should not type the work details on the happy path.

## 11. Verification and measurable success

| ID | Acceptance check |
| --- | --- |
| A01 | Real microphone speech creates the expected work proposal and draft invoice after confirmation |
| A02 | Canonical labor is $180.00, parts $45.00, invoice $225.00; rounding and unknown-price cases behave correctly |
| A03 | Every extracted line has evidence; corrections retain attribution; raw transcripts stay out of customer output |
| A04 | Missing quantities/rates/recipient or ambiguous cumulative reports block approval |
| A05 | Repeated retrieval, concurrent confirmation, and refresh cannot duplicate lines |
| A06 | Unauthorized/cross-organization access, transcript instructions, stale approval, and replayed send confirmation fail |
| A07 | Editing invalidates approval; the PDF and send payload match the exact approved version |
| A08 | A real authorized test send returns a provider receipt to a team-controlled recipient; repeated send clicks do not create a second active attempt |
| A09 | Timeout/unknown result remains visible and is reconciled without blind resend; provider rejection is recoverable |
| A10 | Real wearable evidence creates an attributable invoice proposal and repeated retrieval remains harmless |

A01–A09 establish the voice-and-send baseline; A10 additionally establishes wearable integration. A mock email preview is not A08. Use the [demo fixture](DEMO.md), meaningful service/database checks, one end-to-end browser journey, and a real microphone/sending smoke check.

Measure capture-to-draft time, fields corrected, invoice preparation time, and send outcome. Aim for a short microphone readback within 10 seconds, measure actual venue performance, and track wearable ingestion delay separately. No assumed real-time ingestion SLA.

## 12. Build sequence and delivery

Follow [TASKS.md](TASKS.md): capability check → foundation/seed → deterministic invoice and review → AI and real voice → real wearable → PDF/sending → verification and rehearsal. Check delivery provider access at the start, alongside wearable access, so sending is not discovered to be unavailable at the end.

Freeze features at least 60 minutes before the organizer-confirmed deadline. Preserve a labeled fixture and test-delivery fallback; report the real microphone, wearable, and sending gates independently. This documentation task changes the plan and pushes it to GitHub; it sends no customer invoice.

## 13. After the hackathon

Validate with three to five tradespeople or small maintenance businesses. Measure time from spoken account to a sendable invoice, correction rate, missing billable details, and customer readability. Expand into recurring invoicing and existing accounting workflows if users need them. Determine willingness to pay through interviews. The product direction remains voice-derived invoicing; broader service management is not a prerequisite.
