# Worvo — Build Tasks

**Status:** application implementation not started. All build tasks are unchecked.

**Canonical specification:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

**Working rule:** finish the earliest available dependency, demonstrate its acceptance check, then update this file with evidence.

An implemented task needs a short entry in this format:

```text
Implemented: <concrete behavior and files>
Verified: <command or manual action actually performed and result>
Limitations: <remaining uncertainty, or none observed>
```

Do not check a task because a screen exists or an adapter is stubbed. Record a blocked external capability explicitly and continue independent work.

## T00 — Check hardware and provider access

- [ ] **Dependencies:** none. **Timebox:** first 20 minutes; revisit when access changes.
- Confirm organizer rules, deadline, submission destination, hardware availability, account setup, and recording consent.
- Test one wearable recording naming `JOB-104`; capture a source identity, relevant excerpt, timestamps, and measured retrieval delay.
- Check the available AI, transcription, database, and hosting credentials without committing or printing them.
- Record the selected source path and blockers in [SOURCES.md](SOURCES.md#integration-check-log).
- **Acceptance:** hardware feasibility is evidenced or explicitly unresolved, and the microphone/fixture baseline can proceed without pretending hardware works.

## T01 — Scaffold the app and freeze shared contracts

- [ ] **Dependencies:** T00 attempted.
- Select compatible stable packages; initialize the TypeScript app with pnpm and commit its lockfile.
- Add request/response/error schemas, lifecycle values, capture types, and role definitions from the plan.
- Add a server-only environment validator; reconcile the existing placeholder-only `.env.example` with the selected model and actual implementation.
- Build navigation between manager, job detail, and technician views.
- Implement `dev`, `build`, `lint`, `typecheck`, `test`, and `test:e2e` scripts as the tooling is introduced.
- **Acceptance:** the app boots locally; shared schemas are importable; missing credentials yield a deliberate setup or fixture state; README contains working setup steps.

## T02 — Persistence, identity, and repeatable seed

- [ ] **Dependencies:** T01.
- Create one Drizzle migration history for the minimum model, foreign keys, uniqueness, versioning, and organization boundaries.
- Establish Supabase Auth sessions, server-side membership checks, and the local-only fixture identity mechanism.
- Seed the cafe, `JOB-104`, material catalog, rates, three technicians, and schedule conflicts from [DEMO.md](DEMO.md).
- Support a local reset of synthetic data without deleting connected-account credentials or unrelated records.
- **Acceptance:** a clean database migrates and seeds reproducibly; a reload reads persisted state; foreign-organization reads fail; the seed cannot run through a public unauthenticated route.

## T03 — Quote and scheduling services

- [ ] **Dependencies:** T02.
- Implement intake, quote proposal validation, deterministic pricing, quote version approval, worker eligibility, conflict-safe assignment, and start-work transitions.
- Expose the matching API routes and wire a minimal manager flow.
- **Acceptance:** A01–A03 pass; an unknown price blocks approval and two simultaneous overlapping assignments cannot both succeed.

## T04 — Transactional work and closeout engine

- [ ] **Dependencies:** T02, T03.
- Implement proposal persistence and clarification revisions using synthetic extraction results initially.
- Add confirmed incremental labor, catalog usage, stock movements, review state, and closeout attestation.
- Implement idempotency storage, stale-version checks, atomic application, and the repeated-source policy.
- Add invoice draft/approval and one shared job-economics calculation.
- **Acceptance:** the canonical proposal updates the ledger once; retry, shortage, and stale-version cases preserve consistency; the invoice and dashboard match A06–A08.

## T05 — Structured AI extraction

- [ ] **Dependencies:** T04.
- Implement bounded context construction, Zod-validated output, one schema-repair retry, ambiguity handling, and evidence checks.
- Keep money calculations and all mutations outside model control.
- Add fixtures for ambiguous price meaning, cumulative labor, wrong job, unknown material, contradictory quantity, and transcript prompt injection.
- **Acceptance:** A04's extraction fixture, A05, and the extraction portion of A10 pass. Malformed model output cannot write operational records.

## T06 — Real microphone and confirmation exchange

- [ ] **Dependencies:** T05.
- Add explicit microphone permission, bounded recording/upload, server transcription, and text alternatives.
- Build the worker flow: active job → capture → proposal/clarification → short readback → confirm/cancel → committed acknowledgment.
- Bind live confirmation to actor, job, exact proposal revision, and an expiring challenge. Provide a button fallback.
- **Acceptance:** a real spoken update produces the canonical proposal without typing work fields; permission denial and silence recover; old or replayed confirmations fail; the committed ledger is visible after refresh.

## T07 — Real Vexo adapter

- [ ] **Dependencies:** T00 capability result, T01 contracts; full application of results also needs T04 and T05.
- Implement the supported connection, secure server token handling, narrow retrieval, disconnect, and normalized captures.
- Add pending-ingestion, source-unavailable, revised-source, and reconnect states.
- Run real evidence through the same extraction/confirmation services; use authenticated review for stored speech.
- **Acceptance:** A12 and the real-source duplicate check pass. If external access is unavailable, leave this task unchecked and show the limitation in the presentation.

## T08 — Manager trust view and financial summaries

- [ ] **Dependencies:** T03, T04; actual voice evidence needs T06 or T07.
- Complete the job timeline, quote-versus-actual comparison, evidence excerpts, approval attribution, invoice preview, and minimal manager cards.
- Label source mode, approved invoice value, projected margin, and unavailable collected-payment data clearly.
- Include mobile layouts, keyboard access, readable status, and actionable error states.
- **Acceptance:** a reviewer can trace every canonical billable line to an approved proposal; all financial summaries use the persisted calculation inputs; fixture labels remain visible.

## T09 — Essential reliability and deployment

- [ ] **Dependencies:** T06 and T08; T07 for a wearable-complete claim.
- Run the full A01–A11 acceptance matrix and A12 when hardware access permits.
- Run build, typecheck, lint, targeted unit/database checks, and one end-to-end browser journey using the actual project scripts.
- Check authentication, cross-organization access, CSRF protection, server-only secrets, and disabled public reset before exposing a deployment.
- Choose protected hosting only if those checks pass; otherwise rehearse locally.
- **Acceptance:** record actual check results, deployment/local URL, source mode, and limitations in README or the implementation handoff.

## T10 — Rehearse and prepare submission

- [ ] **Dependencies:** T09.
- Follow [DEMO.md](DEMO.md), verify exact numbers, measure latency, and exercise the fallback.
- Prepare a 90-second recording, repository link, runnable demo link if available, integration disclosure, and submission text.
- Verify actual submission fields and permission to use any recorded voices. Submit only through the organizer's confirmed process when authorized.
- **Acceptance:** three clean rehearsals, a playable backup, an accurate feature list, and a recorded submission receipt if the team submits.

The present documentation task authorizes pushing this plan to GitHub. It does not itself authorize event submission, account registration, customer messages, purchases, or production deployment.

## Time budget

Use the organizer-confirmed deadline as `D`. The public schedule is linked in [SOURCES.md](SOURCES.md#s2-vexohacks-event); announcements may change it. These are internal build timeboxes, not event rules.

| Full build allocation | Focus | Exit condition |
| --- | --- | --- |
| First 20 min | T00 | Capability decision and working fallback direction |
| Next 50 min | T01–T02 | Booting app, schema, identity, seed |
| Next 90 min | T03–T04 | Complete deterministic fixture loop |
| Next 80 min | T05–T06 | Real spoken update and confirmed effects |
| Next 50 min | T07, return to hardware earlier if ready | Real evidence or explicit unresolved gate |
| Until `D − 60 min` | T08–T09 | Trust view, correctness, deployment/local decision |
| Final 60 min | T10 and fixes only | Rehearsal, backup, submission preparation |

If starting with roughly four hours left, allocate 15 minutes to capability/scaffold decisions, 60 to the fixture business loop, 60 to real voice, 30 to the wearable adapter, and 15 to the trust view. Preserve the final 60 minutes for verification and rehearsal. Reuse a seeded quote and assignment if necessary; disclose that those upstream steps are seeded. This reduced path does not establish full A01–A12 completion.

## Optional ownership when multiple agents are assigned

| Owner | Files and responsibilities | Integration boundary |
| --- | --- | --- |
| Backend/AI owner | Migrations, auth, schemas, services, APIs, adapters, invariant tests | Publish contracts and a fixture response before UI integration |
| Frontend/demo owner | Components, manager/worker pages, browser capture, presentation states, demo rehearsal | Use the shared contracts; never reimplement pricing in UI |

Integrate after the deterministic loop, after real voice, and after real wearable retrieval. Avoid simultaneous edits to shared schemas, dependency manifests, or migrations; nominate one owner first. A single agent can implement the same sequence without additional orchestration.
