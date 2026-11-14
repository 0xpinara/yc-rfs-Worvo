> **Post-hackathon plan.** For the hackathon build, [AGENTS.md](../AGENTS.md) is the scope. Do not implement this document today.

# Worvo: three-person parallel implementation

This is the execution split for the canonical [implementation plan](IMPLEMENTATION_PLAN.md), not a scope replacement. People A, B, and C can be assigned to teammates without changing the interfaces. Start all three after distributing the common foundation below. Target one solo plumber, one business, USD, synthetic Juniper Cafe, and Stripe sandbox only.

## Outcome and gates

Ship: **live band-53 voice command** → proposed invoice → server-priced $225.00 draft → **auto-authorized live band command** → one Stripe sandbox invoice → hosted test payment → webhook-reconciled payment state. The invoice contains 90 minutes at $120/hour ($180) and two valves at $22.50 ($45). No tax is assessed in the synthetic scenario; real tax policy is not inferred.

**Decision (2026-11-14): band-only is the primary deliverable.** The founder confirmed that band audio reaches the app live. A10 is now the main demo path, under the rules in IMPLEMENTATION_PLAN.md §2. Authenticated phone approval is the fallback and exception path (unresolved drafts, retrieved memory, band failure). No wrist speaker is assumed. No dispatch, inventory, recruiting, dashboards for profit, TTS, second model, or custom PDF/email renderer.

**Lane impact:**
- **A** prioritizes the live band audio path (A3/A4 before polish). A sends B the capture's live-BLE provenance: band name, session, capture start/end, and server receipt time.
- **B** adds `authorizeFromLiveBandCommand(context, captureId)`, which checks every §2 rule and auto-chains into the existing send operation. The phone `authorize` route stays for the fallback.
- **C** makes the companion screen a status view (listening → draft → sent → paid) that needs no taps in the happy path, and keeps the review/approve UI for exceptions.

## What has been prepared

- Next.js App Router/React/TypeScript shell under `src/app`, one pnpm lockfile, exact dependency pins, loopback-only dev/start scripts, ESLint, and Node test runner through tsx.
- `src/shared/contracts.ts`: Zod capture, extraction proposal, invoice view, revision request, and API result/error types. Audio limits and band number **53** live here once.
- `src/fixtures/invoice.ts`: one synthetic utterance/proposal and $225 invoice view. No approval; no sending; `.invalid` email is presentation-only and must never reach Stripe.
- `tests/contracts.test.ts`: checks shared fixture shape, provenance, integer money, and rejection of client authority fields. These are foundation checks, not implementation of invoice arithmetic or authorization.
- Existing wearable kit is a sibling of this repo: `../vexo-open-kit`. `../connect_watch.py` and `../.venv` belong to the current Windows machine, not portable dependencies of this app. Do not copy them into teammates' repos or introduce a second application/lockfile.
- Band 53 previously connected over Python Bluetooth, reported firmware 1.1.0, and produced 30 motion readings. This is evidence of BLE/motion only. Audio, browser-to-app integration, LEDs, authenticated band commands, and provider services remain unverified.

The shell has no authentication, database, mutations, microphone recording, extraction, or Stripe integration. Its home page says so. Shared schemas validate shape only; all semantic checks, pricing, ownership, and authorization still belong to B's server.

Verification on 2026-11-14: frozen-lockfile install passed; `pnpm check` passed TypeScript, ESLint and 4/4 contract tests; `pnpm build` compiled and generated the static shell. No provider or browser interaction was tested. ESLint 9 is intentionally pinned to satisfy the current Next React plugin's peer range; pnpm reports that ESLint major as deprecated. Upgrade the lint stack together when that plugin supports ESLint 10. Next also noted an unrelated parent-folder lockfile and correctly ignored it outside this Git repository.

## Ownership: three independent lanes

| Person | Owns | Primary files | First result without other lanes |
| --- | --- | --- | --- |
| **A — voice and wearable** | Capture, transcription, one Gemini extraction adapter, real band evidence | `src/server/capture/**`, `src/server/extraction/**`, `src/components/capture/**`, `src/app/api/captures/**`, capture/extraction tests, `docs/SOURCES.md` | Fixture/typed transcript → validated `Proposal`; recorder component tested with callback |
| **B — invoice backend and money** | Identity/business scope, DB/migrations, pricing, revisions, approvals, durable Stripe operations/webhooks | `src/server/auth/**`, `src/server/db/**`, `src/server/invoices/**`, `src/server/stripe/**`, `src/app/api/invoices/**`, `src/app/api/stripe/**`, `src/app/api/setup/**`, `src/app/auth/**`, auth/finance tests, `drizzle*` | Fixture proposal → deterministic invoice service tests; auth/DB schema work proceeds independently |
| **C — companion UI and integration** | Setup/review/history UI, correction/approval UX, contract fixtures for error states, end-to-end checks and rehearsal | `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/(companion)/**`, `src/components/invoices/**`, `src/components/setup/**`, `src/lib/api.ts`, UI/e2e tests, README/DEMO/TASKS | Fixture-based review/history and pending/error states without a server |

B is integration captain and sole owner of `src/shared/contracts.ts`, `package.json`, lockfile, `.env.example`, migration generation/order, and shared server environment validation after this handoff. A/C request small contract/dependency changes with a sample payload; B applies them once and notifies both. Each person owns tests beside their lane; C's test coordination does not replace A/B tests. Keep the contract vocabulary stable; don't build parallel competing invoice models.

C owns the recorder's placement; A owns its behavior and browser permissions. B owns login callback/session plumbing; C owns login/setup forms. A never writes directly to invoice tables or invokes Stripe. C never computes authoritative totals or grants approval locally. B never embeds provider calls in the UI.

## Before the three people branch

1. Review this document and `AGENTS.md`; assign A/B/C names and agree on the first checkpoint. Distribute the same foundation commit/snapshot. Foundation is local until the team commits/pushes it; don't start from the upstream documentation-only checkout by mistake.
2. Use Node 24 (tested locally: 24.14.0) and pnpm 10.30.3. Run `pnpm install --frozen-lockfile`, `pnpm check`, and `pnpm build` in this repo. `pnpm dev` opens the shell at `http://localhost:3000`. With the workspace's command convention, prefix terminal commands with `rtk`.
3. Each person uses their own clone/branch from that same base: `work/capture`, `work/invoices`, `work/companion`. Only one person edits a checkout at once. No worktrees or branches were created by this setup.
4. B inventories an already authorized Supabase project, Stripe sandbox/restricted test key + webhook secret, verified controlled recipient, and database connection. A inventories Gemini/Deepgram access. Enter credentials privately into ignored `.env.local`; never paste values in chat, branches, screenshots, or logs. No credentials are required for fixture development. Do not create accounts or enable live sending as a side effect of setup.
5. Each machine using a band installs/clones the official kit separately and gets its actual band number. This team's band remains **53**, exact name `Vexo-HACK-53`; reject any other band. Close the kit dashboard/Python check before the app connects. One Bluetooth consumer at a time.

Do not wait for all provider credentials to start. A uses fixture extraction, B uses fake Stripe responses, C uses view fixtures. Missing access blocks only the corresponding real-integration acceptance test.

## Contract freeze: wire and service boundaries

Import shapes/types from `src/shared/contracts.ts`. Don't create a generic adapter framework; one implementation per provider plus test doubles suffices. Future fields below are explicit B-owned extensions, not implemented endpoints.

### A → B: capture and proposal

- A's extraction function: `extractProposal(capture: Capture): Promise<Proposal>`. It can also select the labeled fixture in tests. A configures one Gemini model via env after checking availability; do not auto-fallback to another vendor.
- A's transcriber returns `{ transcript, durationSeconds }` from bounded validated audio. B owns persistence/authenticated attribution; A owns audio validation and transcription. Capture HTTP handlers call B's `requireBusinessContext()` before provider work and B's `saveCapture(context, input)` to persist. Until those exist, A tests the pure functions against an explicit fake context/store, never an unauthenticated route.
- Capture source IDs must remain stable across retries; content hash is computed/verified server-side. Persist capture time and ingestion/retrieval time separately. `sessionId` in a DTO is provenance, not proof of identity. Server checks ownership and binds the actual session.
- `POST /api/captures/transcribe`: authenticated multipart audio, permitted content/type/container checks, max 60 seconds/20 MiB, idempotency header → `{ capture: Capture }`. Enforce streamed byte limits and verified duration, not only Content-Length or browser assertions. Do not trust a filename/MIME header alone. Opus packets from the band require an appropriate supported container/decoder; don't label them WebM just to pass validation.
- **Add** `POST /api/captures/text`: typed input or authenticated browser bridge transcript + bounded source metadata → `{ capture: Capture }`. It uses the same persistence service and dedup rules. Browser assertions about `vexo_ble` provenance remain marked unverified unless the bridge proves them; no route accepts `businessId`/`actorId` as authority.
- B's `POST /api/invoices/draft` takes `{ captureId, visitReference }` and an idempotency header, loads scoped capture/context, invokes A's extractor, resolves saved customer/prices, and persists a revision → `{ invoice: InvoiceView }`.
- A's proposal contains intent/evidence, never authoritative customer email, totals, business identity, tool calls, or approval. Validate quoted evidence against the actual source and handle absent/contradictory quantities as unresolved. An excerpt containing “send it” remains evidence only.
- Capture content/source uniqueness prevents repeated ingestion; billable visit overlap is separate. B reviews overlaps across different recordings and can mark `duplicate_visit`. Same content on different visits must not be silently discarded solely by a global hash.

### B → C: companion API

All JSON responses use `ApiResult<T>`. Validate outgoing fixtures and incoming responses with shared schemas. Use integer cents and ISO UTC timestamps; store the business timezone for “today” before resolving service dates. A fixture's null service date isn't permission to guess.

| Route | Request / response data | Owner |
| --- | --- | --- |
| `GET /api/setup` | Scoped business policy, customer directory, catalog, readiness booleans; no secrets | B |
| `PATCH /api/setup` | Allowlisted customer/rate/policy changes with expected config version, never raw credentials | B |
| `GET /api/invoices` | `{ invoices: InvoiceView[] }`; bounded history | B |
| `GET /api/invoices/:id` | `{ invoice: InvoiceView, evidence, operation }`; private evidence and provider references | B |
| `PATCH /api/invoices/:id` | `{ expectedRevision, corrections }`; attributed allowlisted edits, new version → `{ invoice }` | B |
| `POST /api/invoices/:id/authorize` | `RevisionRequestSchema` body; authenticated phone approval, server snapshot → `{ invoice }` | B |
| `POST /api/invoices/:id/send` | `RevisionRequestSchema` body; authorization lookup + durable operation → `{ invoice, operationId }` | B |
| `POST /api/stripe/webhook` | Raw signed payload; durable inbox acknowledgement then recoverable processing | B |

The `corrections` shape must be added by B before C wires edit submission: allow customer selection from saved IDs, service description/date, labor minutes, catalog material quantities, and explicit user-entered pricing only with attribution and policy validation. Recipient changes go through saved verified customer context; arbitrary transcript/client emails are rejected. UI correction proposals never supply trusted line totals.

Use `Idempotency-Key` on mutations. Same scoped key + same payload returns the same result; key + different payload → 409 `idempotency_conflict`. POST authorize/send include `expectedRevision`, never client totals/recipient/actor. Authenticated context and exact approved snapshot are loaded server-side. Idempotency is scoped by business + route/action + resource, including conflicts.

| HTTP | Error code | C's response |
| --- | --- | --- |
| 401 / 403 | `unauthenticated` / `forbidden` | Sign in or deny access; never switch identity |
| 404 | `not_found` | Scoped record absent; do not expose another business |
| 422 | `invalid_input` / `unresolved_fields` | Show specific questions/fields; keep draft intact |
| 409 | `stale_revision` / `duplicate_visit` / `idempotency_conflict` | Reload/review the current draft; no blind retry |
| 409 | `send_locked` / `send_unknown` | Disable editing/approval/send, poll read-only status |
| 503 | `provider_unavailable` | Preserve draft; retry only a safe, resumable operation |

Accepted ongoing send work returns 202 with `sendStatus: pending`; completed requests return 200. Unknown outcome is recorded explicitly and may return 409 `send_unknown`; retrieving current status remains available. Do not return an HTTP success and silently leave the UI believing email was delivered.

### Lifecycle and authorization

- `InvoiceView` is for display, not a database row or send request. B extends it as needed with shared review, not unilateral duplicate status strings.
- `stage` tracks draft/finalized separately from `sendStatus` and `paymentStatus`. `emailEventObserved` means only an event, not delivery. `paymentCollection` distinguishes out-of-band settlement from Stripe-collected funds.
- Ready for authorization requires known/verified recipient, resolved catalog or attributed prices, complete required billing/terms fields, resolved visit overlap, and explicit configured tax policy (synthetic policy only in a labeled sandbox fixture).
- An authorization stores actor, business, source/session, draft ID/revision, recipient + line/rate/tax/terms snapshot/hash, intent, and time. Any correction invalidates it. Send revalidates ownership, revision and snapshot.
- Pending/unknown finalization or send locks edits immediately, before provider I/O. A finalized invoice keeps its original history even after a send failure. Use the same approved snapshot for a safe retry; changes require a later explicit void/replacement workflow, not mutation of history.
- No endpoint for band-only authorization until A documents a proven mechanism binding fresh user intent to the exact snapshot. BLE connection/name, a tap, transcript text, or a session ID alone is insufficient. A10 remains incomplete meanwhile.

## Person A: capture, extraction, band integration

**A1 — start independently.** Add fixture and negative extraction tests using the shared `Proposal` schema. Implement one pure extraction entry point and bounded text normalization. Test unknown customer, missing rate references, ambiguous “$45 in parts,” prompt injection, partial/refused model output, and unsupported material quantities. No provider result may set approval.

**A2 — recorder + transcription.** Build a user-initiated browser recorder component with start/stop, permission-denied/silence/error states, cleanup on unmount/disconnect, and elapsed time. Send validated bounded audio to the server-only Deepgram adapter. Notify C of the component props (`onCapture(capture)`, disabled/busy/error feedback). Keep keys server-side; no localStorage transcript/secret persistence. Ensure the speech provider URL retains the kit's privacy opt-out when applicable.

**A3 — wearable spike (time-box ~60–90 minutes).** Prefer the official kit's browser Bluetooth + audio facilities in the same app/session; keep its MIT attribution. Verify exact band 53 selection and post-connect reported number. Keep audio decoder/library client-only. Record which formats and sample timing actually work and whether phone/browser support is available. A desktop BLE receiver still requiring a laptop is not the target no-computer flow. Stop speculative OAuth/memory work unless that interface is actually needed and documented; BLE access and Vexo cloud retrieval are different paths.

**A4 — integrate.** Persist actual consenting audio/text as an attributable capture, then invoke B's draft endpoint. Source/retrieval times and whether audio is live or prerecorded must be visible. Repeated capture uses its stable source identity. A9 requires a real band draft; A10 is separate. If band-to-phone support fails, deliver labeled real laptop-band proof plus the real phone-microphone fallback, explicitly disclosing the gap.

A and B jointly own source retention/revocation: A stops capture and revokes any verified provider connection on disconnect; B implements scoped removal of retained excerpts and access controls without silently deleting finalized financial history. Explain that deleting a provider source does not delete Worvo's local copy. Store any OAuth credentials encrypted server-side only if the verified retrieval path actually needs them.

**A exits with:** A08 and A09 evidence or a concrete hardware/access blocker; validated extraction negatives; no send authorization shortcut. A owns `docs/SOURCES.md` capability evidence and redacted test results. Optional lights/gestures only after the capture path; microphone's blue LED takes precedence and cannot serve arbitrary status colors while recording.

## Person B: identity, invoices, Stripe

**B1 — first integration blocker.** Create server-only environment validation and verified Supabase SSR auth. Export `requireBusinessContext()` and scoped capture/draft service signatures early so A can wire routes. Build Drizzle schema + one ordered migration set and idempotent synthetic seed. Seed owner only to an explicitly supplied authenticated user, not first login or a hardcoded identity bypass. Persist after restart; no in-memory production invoice store.

Tables: businesses/members, customers (verified recipient/mapping), catalog/rates, captures, invoice revisions + lines/evidence/corrections, authorizations, operations/steps, webhook inbox and audit. Include composite ownership constraints, revision predicates, uniqueness for source IDs, operation keys, Stripe mappings and webhook event IDs. Exposed tables require RLS and restrictive grants; server Drizzle access must still scope every query because privileged DB credentials can bypass RLS. Test cross-business access.

**B2 — deterministic invoice service.** Build from the fixture first, independently of live extraction. Calculate labor half-up once with overflow-safe integer arithmetic: `(minutes × hourlyRateCents + 30) / 60` floored, using BigInt or checked safe integers; material quantity × price; sum validated cents. Reject overflow, zero/fractional/negative quantities and missing prices. Rate/recipient/tax/terms snapshots are persisted at the revision. Implement attributed corrections, approval invalidation, source dedup and overlapping-visit review. Add scoped setup/read/correct/approve APIs and cross-site mutation protection.

**B3 — durable Stripe sandbox.** Install/pin the current Stripe SDK/API version together after checking official docs and record versions in SOURCES via A. Reject live credentials/livemode in this demo. Before calling Stripe persist the operation, approved payload hash and per-step keys. Map/reuse the saved customer with concurrency protection, create one `send_invoice` draft with `auto_advance=false`, attach each line explicitly to it, reconcile every paginated line/recipient/tax/credit/discount/total, finalize explicitly with auto advancement off, then request sending. Reject unexpected adjustments instead of accepting a changed total. `.invalid` fixture recipient cannot be used: require the controlled verified test recipient.

Stable keys derive from operation ID + customer/invoice/line/finalize/send step, never random retry IDs. Use a DB compare-and-set/lease to claim progress, release before network calls, and persist provider IDs/results per step. No database/Stripe shared transaction is claimed. After a timeout/crash/lease expiry, inspect Stripe using saved identifiers and metadata before resuming; never blindly recreate/send after idempotency retention expiry. Resume the same invoice across partial failures.

**B4 — webhook + recovery.** Read raw request body and verify signature before parsing/persisting. Deduplicate durably and process recoverably; a crash after recording an event must not lose it. Explicit reprocessing of pending inbox/operation rows must work without a new invoice request; use a bounded local recovery command first, not a new queue service. Retrieve current Stripe state for out-of-order events. Keep paid status distinct from actual Stripe-collected funds. Never mark paid from a client return URL.

**B exits with:** A01–A07 and A11–A12 automated checks and real sandbox evidence where access exists. No real email/charge/account registration/public deployment. Backend is the critical path; drop optional capture modes/TTS before weakening idempotency/auth/reconciliation.

## Person C: companion UI and integration captain's test partner

**C1 — start independently.** Build mobile-friendly setup, invoice review/corrections and history from `DEMO_INVOICE`, not fake live endpoints. Use local UI test fixtures for pending questions, stale revision, locked/unknown send, failed provider, finalized/send-requested/email-event/paid. Keep fixtures visible as fixtures and unreachable from live mutation code. Avoid a second backend or mock service runtime.

**C2 — controls and auth UI.** Add login/setup forms connected to B's Supabase plumbing and setup endpoints; show missing configuration as concrete readiness items. Review includes customer/saved recipient, date/terms, professional itemized lines and total; private evidence/corrections stay in authenticated review. Approve button states the exact recipient and amount/revision. Correction invalidates the old approval in the server response; refresh on 409. No optimistic sent/paid state. Display the sending lock even if the request times out.

**C3 — integrate progressively.** Import A's capture component; call draft using the stored capture ID. Wire history/read, correction, explicit authorize then send. Poll read-only status while sending is pending/unknown and stop polling on unmount. Only offer hosted invoice/PDF links from authenticated invoice reads; keep them out of analytics/logs. Every control has a label, keyboard access, clear focus, pending state and recoverable error. Phone approval is the default honest flow.

**C4 — end-to-end and rehearsal.** Coordinate a real phone test and Stripe sandbox hosted payment/webhook demonstration with B, replay captures/send clicks, edit after approval, test stale tabs, reload during unknown send, replay/out-of-order webhooks, and confirm $225. Keep fixture vs real mic vs wearable vs sandbox vs actual delivery results separate in DEMO/TASKS. Own the final README commands and accessible exception flow. Get consent before recording; don't put customer/private recording data in test artifacts.

**C exits with:** the complete working phone flow and A08/A11 UI evidence, plus end-to-end coverage of A01–A07/A12 with B. Test basic mobile browser support early rather than designing only for the desktop kit dashboard.

## Parallel checkpoints and merge order

### Copyable teammate kickoff

- **A:** “Take Person A in docs/PARALLEL_WORK_PLAN.md. Read the canonical docs and start A1 fixture extraction plus the recorder callback contract. Own capture/extraction and band-53 evidence; coordinate persistence/auth with B and recorder placement with C. Do not implement sending or claim A10.”
- **B:** “Take Person B in docs/PARALLEL_WORK_PLAN.md. Start B1 auth/context/service signatures and B2 pure invoice arithmetic tests in parallel with schema work. Own shared contracts, dependencies, migrations and all financial mutations. Publish the service signatures early; Stripe remains sandbox-only.”
- **C:** “Take Person C in docs/PARALLEL_WORK_PLAN.md. Start C1 fixture review/history/error states using src/fixtures/invoice.ts. Own companion UI and e2e/rehearsal, coordinate recorder with A and login/setup/API contracts with B. Never show fixture send/payment success as a real provider result.”

These are work blocks, not promises about unverified provider setup. Reserve a full block for integration rather than merging everything minutes before a demo.

| Checkpoint | A | B | C | Integration gate |
| --- | --- | --- | --- | --- |
| 0: common base | Import shared shapes | Own shared files/migrations | Run fixture view | All install/check/build on same base |
| 1: independent first slices | Fixture extraction + recorder callback | Auth/service signatures + pure pricing + schema | Fixture review/history/errors | A/C proceed on fixtures even if hosted services blocked |
| 2: first vertical slice | Capture stored + extract callable | Authenticated persisted draft/read/correct/authorize | Wire review + pending questions | $225 fixture draft persists; stale/foreign actor blocked |
| 3: real services | Real phone mic + Gemini/Deepgram; band spike | Stripe operations, fake failure tests, webhook inbox | Wire approve/send/status + mobile tests | One sandbox invoice; no duplicate effects; unknown send locked |
| 4: joint acceptance | Demonstrate actual wearable input or disclose blocker | Sandbox test payment and recovery | Run end-to-end/rehearse/report | A01–A09/A11–A12 evidenced or explicitly blocked; A10 separate |

Merge small buildable changes, normally B1 interfaces/auth/schema → A1 extraction + C1 fixture UI independently → B2 draft services → A2/C2 integration → B3/B4 sandbox → A3/A4 + C3/C4 final checks. A/C do not need to wait for B1 to start their pure/fixture work. Do not merge unauthenticated mutation stubs or fake send success to speed integration.

On each shared contract change: B updates schema + example fixture + contract tests, announces the change, A/C rebase and rerun checks before continuing. Regenerate pnpm lockfile only once after merging dependency requests. B serializes schema migrations; never let three people generate competing initial migrations.

At handoff record branch/commit, owned files, actual checks, missing env/access by variable name only, and next blocker. Don't commit teammates' secrets or change the official kit. No push, PR, branch creation, deployment, or real financial action was performed by this setup.

## Acceptance ownership and minimum tests

| Acceptance | Accountable | Required proof |
| --- | --- | --- |
| A01–A02 pricing and ambiguity | B, A supports | $225; half-cent labor rounding, unknown rates/customer, ambiguous parts and tax blocked |
| A03 identity and intent | B, A supports | Foreign business, stale revision, historical “send,” injected approval and CSRF rejected |
| A04–A05 duplicate/failure safety | B | Parallel send/capture retries; crash/timeout after each external step; one invoice and resumable operation |
| A06–A07 lifecycle/payment | B + C | Signed/replayed/out-of-order events; sandbox hosted payment; no email-delivery or real-funds claim |
| A08 microphone | A + C | Actual demo phone recording, denial/silence/oversize/unsupported audio/provider error handling |
| A09 wearable draft | A | Consented band-53 audio/text reaches persisted invoice; provenance/timing visible |
| A10 fully hands-free send | A proposes, B validates | Proven fresh exact-snapshot authorization; otherwise explicitly incomplete |
| A11 detailed invoice/privacy | C + B | Preview, all Stripe lines/PDF, recipient and total match snapshot; private evidence excluded |
| A12 revision/uncertain-send | B + C | Correction revokes approval; pending/unknown prevents edits/resend; finalized history preserved |

Run `pnpm check` and `pnpm build` for each integration candidate. C adds browser e2e tooling only when the flow exists; B adds DB/Stripe integration checks, not substitutes with contract tests. Live provider tests are explicit opt-in and skip with a stated missing variable/access reason; fixture checks do not masquerade as provider checks.

## Blockers and fallback decisions

- **No Supabase/DB access:** B can finish pure pricing/state-machine/operation tests; A/C finish fixtures. Persistent authenticated acceptance stays blocked; never substitute a hardcoded public identity.
- **No Stripe sandbox/test recipient/webhook access:** B tests provider failures with fakes; show draft only. Do not label a fixture invoice as a real sandbox invoice or claim payment/email success.
- **No model/speech credentials:** A uses explicitly synthetic/typed transcript path. Do not silently make up transcripts or show fixture extraction as real AI.
- **No usable band-to-phone path:** phone microphone + phone approval ships as the documented fallback. Band motion on a laptop does not satisfy wearable audio or no-computer acceptance.
- **No fresh band-command proof:** authenticated phone approval. No relaxed checks, gesture-to-send, voice-identity guess, or replayed recording workaround.
- **Schedule pressure:** omit optional TTS, memory OAuth, motion/lights and richer UI polish first. Keep invoice semantics, authorization, integer math, privacy and durable retries.

## Reference decisions

The installed baseline pins Next 16.4.6, React 19.3.1, Zod 4.6.7, TypeScript 5.9.3 and pnpm 10.30.3 in the manifest/lockfile. Provider packages are deliberately left for their owner to install once used; AI model IDs remain configurable and unselected until actual access is checked.

Official guidance checked during preparation: [Next manual setup](https://nextjs.org/docs/app/getting-started/installation), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side), [Supabase changelog](https://supabase.com/changelog), [Stripe invoice lifecycle](https://docs.stripe.com/invoicing/integration/workflow-transitions), [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests), and [Stripe webhook verification](https://docs.stripe.com/webhooks/signature). Use current version-matched docs again when implementing an adapter. No provider account capability is proven by reading documentation.
