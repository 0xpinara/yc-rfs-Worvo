# Worvo implementation plan

**First draft:** a solo plumber creates and sends an invoice by speaking to a wearable.
**Status:** local shell, shared contracts, fixtures, and contract tests prepared; product integrations are not implemented. Use [PARALLEL_WORK_PLAN.md](PARALLEL_WORK_PLAN.md) for the three-person execution split.

## 1. Product and scope

The plumber already has customers and does their own work. Worvo removes invoice entry after a visit. It does not recruit, verify, match, route, or dispatch technicians.

Target utterance:

> Worvo, invoice Juniper Cafe for today's sink repair. Ninety minutes of labor at my usual rate and two shutoff valves at the standard price. Send it to their saved billing email.

Initial setup links the plumber's business, Stripe account, customer directory, email recipients, currency, rates, and invoicing/tax policy. That setup may use a phone/browser. Routine invoicing should then require no computer. Exceptions can require phone review; do not disguise that as a fully hands-free success.

P0 includes one plumber, one business, known customers, USD, evidence-backed extraction, deterministic amounts, Stripe invoice creation/sending, and payment status. Exclude dispatch, technician onboarding, quotes, inventory, cost/profit dashboards, scheduling, manager approvals, and expense imports. The broader physical-work coordination vision is future work.

## 2. Wearable and authorization gates

Founder-provided hardware description: Vexo Open has a microphone, motion sensor, and colour light. No speaker is assumed. Hardware and exposed interfaces still need real checks.

Keep these input paths distinct:

- **Vexo memory:** bounded retrieval of earlier recordings or transcripts. Preserve source identity and capture/retrieval time. This is evidence, not current authorization.
- **Live microphone:** browser/phone audio in an authenticated session. Transcribe through Deepgram when raw audio is available.
- **Recorded demo:** visibly labeled synthetic fixtures.

If Vexo supplies usable text, send that to extraction without another transcription pass. Do not assume live band streaming, raw audio access, gestures, programmable lights, or fast ingestion from the existence of hardware.

### Decision (2026-11-14): band-only send is the primary demo path

The founder confirmed that band 53's audio reaches the app live. **The primary flow is band-only:** the plumber speaks, and a fully resolved invoice is created and sent in the Stripe sandbox with no phone or computer interaction. Phone approval is now the fallback and the exception path, not the default.

A **live band command** authorizes a send only when **all** of these hold. The server checks every one and records them in the authorization:

1. **Live source.** The capture arrived over the live BLE audio path from exactly `Vexo-HACK-53`. The band was connected inside the plumber's authenticated app session (the device holding the BLE connection). Server receipt is within 120 seconds of capture end.
2. **Explicit intent in the same utterance.** The utterance itself says to send ("send it", "send the invoice"). Intent from a different or earlier capture does not count.
3. **Fully resolved draft.** The customer matches exactly one saved record. The recipient is that customer's saved verified email. Every price comes from the saved catalog or rates. There are no ambiguities, no duplicate-visit flag, and the tax policy is configured.
4. **Bound snapshot.** The authorization stores `method: live_band_command`, actor, captureId, draft revision, recipient, line/total snapshot hash and intent. It authorizes only that revision.
5. **Single use.** One capture can authorize at most one send. Repeated or retried processing of the same capture reuses the same operation and invoice.
6. **Sandbox only.** Reject live Stripe keys and `livemode` objects.

These never auto-send. They create a draft held for review on the companion screen:
- Vexo cloud memory or other retrieved transcripts
- recorded or fixture audio
- any capture failing a rule above

A motion gesture may **cancel** during an optional short hold before finalize. It can never approve. If the LED is controllable, it shows sent or needs-review, with the same status mirrored in the companion UI.

**Fallback** (live band path fails during the demo): the phone microphone captures, and the plumber approves on the authenticated phone. State this honestly; it does not count as A10.

No band speaker means the system cannot rely on a conversational audio readback from the wrist. Use a self-contained command for known customer/rate cases. If a detail is missing, hold the draft and show a concrete question in the companion UI. Optional ElevenLabs/MiniMax readback plays through a phone or headphones.

Motion/light experiments are optional. A verified gesture may request capture, never approve sending. A verified light may indicate capturing, processing, sent, or error; mirror status in text. Only show sent after the provider send step succeeds, and do not equate it with delivered or paid. If control is unavailable, leave native indicators alone.

## 3. Invoice workflow

1. Receive a capture linked server-side to the authenticated business.
2. Extract customer reference, service description, labor duration, material quantities, explicit prices or known-rate references, and requested action.
3. Resolve the customer uniquely from saved records and resolve selling prices from the business's catalog. “Usual rate” is valid only when a configured snapshot exists. Never infer an email, amount, or tax exemption.
4. Calculate the invoice in integer cents. Display the source excerpt and proposed line items in the companion UI.
5. Persist a versioned draft. Unknown customer, ambiguous amount, missing price, unclear labor basis, duplicate work, or unresolved tax configuration leaves it pending clarification.
6. Obtain authorization for that exact draft: automatically from a qualifying live band command (§2 decision), otherwise through authenticated phone approval. Editing a draft invalidates prior authorization.
7. Create and populate a Stripe draft, finalize it, and request sending through Stripe Invoicing.
8. Store the hosted invoice/PDF references privately and track sending and payment through Stripe events.

The model only proposes fields. Server code owns customer resolution, rates, arithmetic, authorization, and Stripe actions. The source text cannot select a business, change credentials, invoke tools, or approve itself.

### Detailed invoice and evidence

Each customer-facing invoice includes the business and customer billing identities, invoice number/date, service date when known, visit reference, professional work description, itemized labor/parts, quantities/units, rate and line amount, subtotal, configured fees/tax, total due, and configured due date/terms. Keep an unresolved required field visibly pending rather than inventing it. A visit reference only groups evidence; it does not introduce a job-management lifecycle.

Link every extracted line to its capture/proposal, or record explicit user-entry attribution. Keep the original source and attributed corrections in the authenticated review view. Raw transcripts, private citation URLs, unrelated conversations, and internal costs must not appear in the customer invoice. Reconcile the Stripe-rendered invoice/PDF and send payload against the authorized version; use Stripe's document and delivery flow rather than building a second PDF renderer or email adapter.

### Revisions and uncertain sends

Draft corrections create attributed revisions and invalidate approval. The phone fallback explicitly approves the exact version and recipient before requesting send; the proven band-only path may authorize both through its bound command. Lock edits while finalization or sending is pending or its outcome is unknown. Show “Send status unknown” on ambiguous timeouts and reconcile with Stripe before retrying. A confirmed failure permits a retry of the same authorized payload or a correction followed by new authorization.

Once finalized, preserve the original invoice and its evidence. Do not silently edit financial history after sending. Replacement/void/credit workflows require explicit later implementation; they are outside this first draft.

## 4. Stripe Invoicing is the core integration

Use Stripe Invoicing for a customer-specific bill with line items, payment terms, a PDF, and a hosted payment page. A generic reusable Payment Link is not the primary invoice record. See [official references](SOURCES.md#stripe).

For the first prototype, use one plumber's own Stripe sandbox account and one business. No platform marketplace or split payments are needed. If Worvo later supports independent businesses connecting their own accounts, design Stripe Connect onboarding and account isolation at that point. Connect is also relevant to SaaS platforms, not just marketplaces; never route unrelated businesses through one plumber's account.

### Server-side sequence

- Find or create the Stripe Customer from the saved, verified local customer. Persist the mapping and prevent concurrent duplicate creation.
- Create a draft with collection_method=send_invoice, explicit currency/payment terms, automatic advancement disabled, and local operation metadata. Do not automatically charge a stored payment method.
- Add each validated line to this specific invoice. Do not leave unrelated pending customer items eligible for accidental inclusion.
- Reconcile the Stripe draft's lines, recipient, subtotal, discounts/credits, tax configuration, and payable total against the authorized snapshot. Unexpected adjustments block sending.
- Explicitly finalize after authorization, obtain the hosted_invoice_url and invoice_pdf, then call the send endpoint. Do not assume finalization alone emailed the customer.
- Record send success and signed webhook events separately from actual email delivery and payment. A timeout is an unknown result to reconcile before retry, not permission to create a new invoice.

Use a server-side restricted key with the required permissions and a separate webhook signing secret. Pin the supported API/SDK version at implementation. No keys or private invoice links in client logs or Git.

### Payment events

Verify the Stripe-Signature against the raw payload. Persist/deduplicate event IDs durably before acknowledging receipt, and process recoverably. Events may arrive out of order; retrieve/reconcile current Stripe state rather than regressing paid to open after a delayed event.

Track invoice.sent, invoice.finalization_failed, invoice.payment_failed, and invoice.paid. The paid event can include an invoice marked paid outside Stripe: distinguish settled invoice status from funds collected through Stripe. Never infer payment from finalization, an email event, or a return page.

### Sandbox and live behavior

Stripe's send API documents that test-mode calls do not send real email even though invoice.sent can occur. Demonstrate a test invoice and hosted test payment page, labeled as simulated sending. Actual email delivery requires a separately authorized live check and real account readiness; do not claim sandbox email delivery.

The canonical fixture is USD and tax not assessed for demonstration. Before live invoicing, configure the business's actual tax policy and required customer fields. Do not enable automatic tax without the necessary registrations/configuration, and never assume missing tax information means zero tax.

## 5. Architecture and minimal persistence

One Next.js/TypeScript app, pnpm, Zod, Supabase Auth/PostgreSQL with Drizzle, Vercel AI SDK with one selected model, and Stripe. Verify compatible versions during scaffolding. Keep provider operations in small server functions; no multi-agent runtime or general provider router.

Minimum records:

- Business/member: authenticated owner, currency, invoicing policy, Stripe account mapping.
- Customers: saved recipient, verified email, business scope, Stripe customer mapping.
- Catalog/rates: labor selling rate and material selling prices, with snapshots on invoices.
- Captures: business, stable source identity, content hash, transcript, source and retrieval times.
- Invoice drafts: source, revision, customer, line snapshots, computed amounts, unresolved fields, authorization record.
- Invoice operations: per-step idempotency keys, request hashes, Stripe IDs, progress, result/error.
- Webhook events/audit: durable provider event IDs and attributable state changes.

Scope every query and mutation to the authenticated business. Enforce foreign-key ownership and expected revisions. Do not trust business/actor IDs from the model or client. Protect cookie-session mutations against cross-site requests.

Browser audio uploads are user-initiated, at most 60 seconds and 20 MB, with server-side type/content validation. Permission denial, silence, unsupported formats, or transcription failure leaves the draft unchanged. Retrieve only the consenting account's selected work context, encrypt connection credentials server-side, and support disconnect/revocation and removal of locally retained excerpts. Source deletion does not automatically remove Worvo's retained copy.

### Minimal API contract

| Endpoint | Purpose |
| --- | --- |
| POST /api/captures/transcribe | Authenticated bounded upload; create/reuse an attributable capture |
| POST /api/captures/text | Authenticated bounded typed/bridge transcript; provenance checked server-side |
| GET /api/setup and PATCH /api/setup | Scoped saved business/customer/rate/policy setup; protected, versioned corrections |
| POST /api/invoices/draft | Extract a stored capture into a versioned invoice proposal |
| GET /api/invoices and GET /api/invoices/:id | Business-scoped history, preview, evidence, and current operation status |
| PATCH /api/invoices/:id | Attributed correction; invalidate prior authorization |
| POST /api/invoices/:id/authorize | Bind authenticated approval or a verified fresh command to the exact revision/recipient |
| POST /api/invoices/:id/send | Resume/create the authorized Stripe invoice operation; no client-supplied authoritative totals |
| POST /api/stripe/webhook | Verify raw-body signatures; persist and reconcile provider events |
| GET /api/vexo/connect and GET /api/vexo/callback | Start and validate the verified provider connection flow |
| POST /api/vexo/disconnect and POST /api/vexo/sync | Revoke/disable connection or retrieve bounded evidence |

Mutations require scoped idempotency keys and relevant expected revisions. Return explicit unresolved-field, stale-version, unauthorized, and unknown-send outcomes. Stripe calls occur only after the corresponding server-side authorization and validation.

Money is integer cents. Round each labor line half-up once: minutes × hourlyRateCents / 60. Sum line amounts. Quantities and minutes are positive integers for this draft. Unknown prices block sending. The demo's 90 minutes at $120/hour plus two valves at $22.50 each gives $225.00 before any real tax determination.

Database and Stripe cannot share one transaction. Persist an operation before calling Stripe, use stable per-operation/per-step idempotency keys, and resume/reconcile after partial failure. Do not hold a database lock through a provider call. Prevent two workers from advancing the same draft concurrently. A retry must reuse the existing invoice; a changed request cannot reuse an old authorization.

Deduplicate source retrieval and detect overlapping reports of the same visit. Changed source content requires a new review revision; a different recording does not automatically mean a new billable visit.

## 6. Sponsor roles

| Provider | Role | Decision |
| --- | --- | --- |
| Stripe | Customer invoice, email send request, hosted payment page, PDF, payment lifecycle | Core P0 integration in sandbox |
| Google DeepMind / Gemini | Structured invoice-field extraction | Preferred model; validate evidence and meaning server-side |
| OpenAI | Same extraction role | Setup alternative to Gemini; implement one |
| Deepgram | Speech-to-text when raw audio is accessible | Use for the real microphone path; skip when Vexo supplies text |
| ElevenLabs | Optional phone/headphone readback | After core flow; disabled by default |
| MiniMax | Alternative optional TTS | Do not add a second voice provider |
| Brex | Potential expense reconciliation | Deferred; not needed to create/send an invoice |

The sponsor list comes from the user. Credits, event sponsorship, accounts, APIs, and hardware access are not proven by this plan. Record actual selected model/voice IDs and measured results. Keep bounded transcripts private, send only necessary customer/catalog context, and never claim calibrated accuracy from model confidence.

## 7. Screens and acceptance checks

Build a small companion setup/review screen and invoice history with source, lines, pending questions, send state, hosted invoice access, and payment state. These support setup and exceptions; do not make a dashboard the main workflow. Keep keyboard access, visible status, and actionable errors.

| ID | Acceptance |
| --- | --- |
| A01 | Known-customer utterance yields 90 minutes, two valves, and a $225.00 draft from saved prices |
| A02 | Wrong/ambiguous customer, unknown price, unclear labor, ambiguous “$45 in parts,” or missing tax setup blocks send |
| A03 | Unauthorized actor, foreign business, stale revision, historical “send,” and transcript injection cannot authorize an invoice |
| A04 | Stripe draft has only the expected customer/lines/total; retry and concurrent processing create one invoice |
| A05 | Failure after customer creation, line creation, finalization, or send resumes safely without duplicate billing or automatic charging |
| A06 | Finalized/send-requested/simulated email/paid are distinct; webhook signatures, replay, and ordering checks pass |
| A07 | A sandbox hosted invoice accepts a test payment and reconciles to paid without implying real funds or delivered email |
| A08 | Real microphone path works; permission denial, silence, provider failure, and missing details recover |
| A09 | A real band recording reaches an attributable invoice draft; source timing and provenance are shown |
| A10 | **Primary demo path.** A live band-53 command with explicit send intent produces one sandbox Stripe invoice with no phone/computer interaction; retrieved memory, fixtures, and unresolved drafts never auto-send |
| A11 | Invoice preview, Stripe lines/PDF, recipient, and send payload match the authorized revision; customer output excludes private evidence |
| A12 | Pending/unknown sends block edits and blind retries; draft correction invalidates authorization; finalized invoices retain their original history |

Fixture checks alone do not establish A08-A10. Phone confirmation is a valid no-computer fallback but not a band-only send success.

## 8. Build order

Follow [TASKS.md](TASKS.md): capability check → app/auth/customers/rates → fixture extraction and draft → sandbox Stripe flow → microphone → real wearable → reliability and demo.

Use [DEMO.md](DEMO.md) for the shared scenario. Do not provision accounts, send live customer invoices, charge money, deploy publicly, or submit to an event merely because this plan describes those future actions. This scope update authorizes planning changes, not live financial operations.
