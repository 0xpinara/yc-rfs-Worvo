> **Post-hackathon plan.** For the hackathon build, [AGENTS.md](../AGENTS.md) is the scope. Do not implement this document today.

# Worvo build tasks

Status: local foundation prepared; T01 remains incomplete until auth, persisted context, and isolation work. Use [PARALLEL_WORK_PLAN.md](PARALLEL_WORK_PLAN.md) for parallel ownership; this list retains product acceptance order.
Canonical specification: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

For each completed task record: Implemented, Verified (actual command/action and result), Limitations. Unverified provider access stays unchecked.

## Foundation handoff (before parallel work)

- Implemented: Next.js shell, pinned pnpm dependencies/lockfile, Zod wire contracts, band 53 constant, synthetic proposal/invoice fixture, and four contract tests.
- Verified: `pnpm check` passed typecheck, lint, and 4/4 tests; `pnpm build` generated the static shell on Node 24.14.0. See execution-plan verification note for final dependency check.
- Limitations: no auth/DB/migrations, extraction, audio, Stripe operations, or provider credentials verified. Fixture total assertions do not implement or test the eventual pricing service. T00 attempted with prior band-53 BLE/motion proof only; recording and authorization gates remain open.

## T00: Prove the input and send-authorization boundary

- [ ] Dependencies: none.
- Confirm real band recording/retrieval, source identity, account ownership, timing, and exposed command interfaces.
- Assume no speaker; check motion/light access only as optional capabilities.
- Determine whether a fresh authenticated command can bind an exact invoice send. If not, document phone approval fallback and leave A10 incomplete.
- Check authorized Stripe sandbox, extraction model, and transcription access without printing secrets. No account provisioning or live invoice send.
- Acceptance: selected input path, actual access, limitations, and per-provider checks recorded in SOURCES.md.

## T01: Scaffold, identity, and saved business context

- [ ] Dependencies: T00 attempted.
- Initialize TypeScript/Next.js, pnpm and one lockfile, Zod schemas, server environment validation, database migrations, and authentication.
- Seed one plumber, synthetic Juniper Cafe, verified test recipient mapping, $120/hour labor, and $22.50/valve.
- Build minimal setup, pending-review, and invoice-history views.
- Acceptance: app boots, business isolation works, seed persists after reload, and README has actual commands.

## T02: Deterministic voice-to-draft slice

- [ ] Dependencies: T01.
- Use synthetic extraction first. Resolve known customer/prices, calculate cent amounts, persist source/draft revision, show unresolved fields.
- Bind authorization to the exact revision and authenticated actor. Do not accept historical transcript approval.
- Implement source deduplication and overlap review before sending.
- Include invoice identity, service date when known, professional descriptions, units/rates, terms, and recipient. Keep line evidence and attributed corrections internal; never include raw transcripts or private source links in customer output.
- Acceptance: A01-A03 pass with fixtures; no provider call or customer message needed.

## T03: Stripe sandbox invoicing

- [ ] Dependencies: T02 and authorized sandbox access.
- Create/reuse mapped customer, controlled draft, invoice-specific lines, and exact snapshot reconciliation.
- Finalize and request sending only after authorization; store private hosted invoice/PDF references.
- Add durable operations, stable per-step idempotency, concurrency protection, and partial-failure reconciliation.
- Block edits during pending/unknown finalization or send. Reconcile uncertain results before retry; compare Stripe preview/PDF and send contents to the authorized revision. Preserve finalized invoice history.
- Verify webhook signatures, persist/deduplicate events, and reconcile out-of-order updates and paid status.
- Acceptance: A04-A07 and A11-A12 pass; sandbox send is labeled simulated and no real email/charge is claimed.

## T04: Structured extraction and real microphone

- [ ] Dependencies: T02; Stripe results depend on T03.
- Implement one model, preferably Gemini, bounded context, schema/evidence validation, and ambiguity handling.
- Add browser recording and Deepgram transcription for accessible raw audio; preserve text input fallback.
- Enforce 60-second/20-MB upload limits and server-side content validation; handle unsupported formats without changing invoice contents.
- Keep visible proposal review and authenticated confirmation. Optional phone/headphone TTS comes only after the core flow works.
- Acceptance: canonical/negative extraction fixtures and A08 pass on the actual demo device.

## T05: Real Vexo input and band-only gate

- [ ] Dependencies: T00 result, T03, T04.
- Retrieve a bounded consenting source through the verified interface, preserve identity/timestamps, and normalize to the same draft service.
- Skip transcription when usable transcript text exists. Distinguish delayed memory from live commands.
- Integrate fresh command authorization only if proven; otherwise require authenticated phone approval.
- Acceptance: A09 evidenced; A10 separately proven or explicitly incomplete. Repeated source/command produces one invoice.

## T06: Reliability and rehearsal

- [ ] Dependencies: T03-T05; external blocked gates remain disclosed.
- Run actual build/typecheck/lint and targeted arithmetic, auth, retries/concurrency, provider failures, and webhook checks.
- Rehearse DEMO.md with sandbox payment and labeled fallbacks. No dispatch/inventory/profit screens.
- Record which checks were fixtures, microphone, real wearable, and real send. No live email claim from sandbox invoice.sent.
- Acceptance: no duplicate invoice; source traceable; $225 total; correct payment state; limitations visible.

Public deployment requires authenticated, protected mutations and disabled remote resets. Real customer delivery, charges, account registration, and event submission require authorization for those specific actions.
