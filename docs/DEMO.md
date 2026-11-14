# Worvo — Demo Runbook

**Status:** rehearsal specification; no live integration is claimed by this document.

**Goal:** one spoken work update becomes approved operational records and a correct financial result.

**Source labels:** Vexo memory / Live microphone / Recorded demo.

## Canonical synthetic scenario

A cafe requests repair of a leaking sink. The approved scope is to replace two shutoff valves with an estimated 90 minutes of labor. Use a safe prop or simulated repair; do not perform a live hazardous maintenance task for the presentation.

| Seed item | Value |
| --- | --- |
| Organization | Worvo Demo Maintenance; USD; America/Los_Angeles |
| Customer/site | Juniper Cafe, a synthetic customer; no real contact details |
| Job | `JOB-104`, “Repair leaking cafe sink” |
| Required skill | `commercial_plumbing` |
| Demo appointment | November 14, 2026, 1:00–2:30 PM Pacific; stored as a UTC interval |
| Eligible technician | Alex Rivera; matching skill; 9 AM–5 PM shift; free for the interval |
| Conflicting technician | Morgan Lee; matching skill; existing 12:30–2:00 PM appointment |
| Ineligible technician | Sam Chen; electrical skill only; same shift |
| Customer labor rate | 12,000 cents/hour ($120.00) |
| Alex's direct labor cost | 4,500 cents/hour ($45.00) |
| Material | Catalog SKU `VALVE-SHUTOFF`; spoken name “shutoff valve” |
| Stock before repair | 10 units |
| Material cost | 1,500 cents/unit ($15.00) |
| Material selling price | 2,250 cents/unit ($22.50) |
| Estimated and actual quantity | 2 units |
| Estimated and actual labor | 90 minutes, incremental for this visit |
| Fees | None |
| Tax policy | Not assessed — demo; no real tax determination |
| Payments | None recorded; no charge or delivery action |

Use a fixed scenario clock or the seeded appointment during replay. Explain that the 90-minute repair is a simulated completed visit, not work performed during the 90-second demo. Internal database IDs can be UUIDs; the logical identifiers above must map consistently.

## Exact expected financial result

| Calculation | Cents | Display |
| --- | --- | --- |
| Labor selling amount: 90 × 12,000 ÷ 60 | 18,000 | $180.00 |
| Materials selling amount: 2 × 2,250 | 4,500 | $45.00 |
| Quote/invoice subtotal; demo total | 22,500 | $225.00 |
| Direct labor cost: 90 × 4,500 ÷ 60 | 6,750 | $67.50 |
| Direct material cost: 2 × 1,500 | 3,000 | $30.00 |
| Total direct cost | 9,750 | $97.50 |
| Projected gross profit | 12,750 | $127.50 |
| Projected gross margin: 12,750 ÷ 22,500 × 100 | — | 56.67% (56.7% on a compact card) |
| Stock after approved work | — | 8 units |

Invoice value is projected revenue before tax, not cash received. The example's gross profit excludes overhead. All final values come from persisted confirmed work and price snapshots, not generated text or hard-coded UI cards.

## Spoken script

Technician update:

> “Worvo, job one oh four. On this visit, I replaced two shutoff valves and worked for 90 minutes. The leak is fixed. Ready for review.”

Expected live-microphone readback:

> “Log 90 minutes and two shutoff valves for job 104, then mark it ready for review?”

Technician, in the active confirmation session:

> “Confirm.”

Expected committed acknowledgment:

> “Saved. Job 104 is ready for review.”

For Vexo memory, retrieve the recorded update and confirm in the authenticated review UI. Do not present a historical “confirm” inside the retrieved text as current authorization. Use live readback only through a tested playback path; do not imply the bracelet played it.

One useful alternate utterance is “used 45 dollars in parts.” The correct response is clarification about cost versus customer price, not an invented interpretation. Keep this for questions after the main demo.

## 90-second presentation

| Time | Action | What it proves |
| --- | --- | --- |
| 0–10 s | Show the technician at the repair prop: “The worker's hands are busy; the job details should still reach the business.” | Physical context and problem |
| 10–25 s | Show request, priced quote, and available technician; approve the prepared drafts | Operational coordination; disclose seeded inputs |
| 25–45 s | Speak the update through the tested capture path, or retrieve a pre-recorded real wearable source | Actual input provenance |
| 45–65 s | Show/read back the proposal and confirm it | Human control and structured capture |
| 65–80 s | Manager accepts the qualified closeout, generates/approves the invoice, and shows the linked timeline | Correct downstream effects |
| 80–90 s | Show $225 invoice value, $127.50 projected gross profit, and evidence; state the expansion vision | A complete operational and financial loop |

If using earlier wearable evidence, say: “This was captured on the bracelet earlier; Worvo is retrieving that recording now.” Show its real source timestamp. If intake and dispatch are pre-seeded to fit the time limit, say so rather than implying they happened live.

The final vision sentence: “Worvo starts with a worker's voice and grows into the coordination layer for people, AI agents, and eventually robots.” Robots are roadmap only.

## Preparation and rehearsal

- [ ] Check current organizer announcements and the real submission requirements.
- [ ] Verify account access, microphone permission, playback volume, venue Wi-Fi, and power.
- [ ] Confirm recording consent; use synthetic customer details and only the relevant excerpt.
- [ ] Run the real hardware check and record which gates pass.
- [ ] Reset only the synthetic demo data; verify stock is 10 and no invoice/work entry remains.
- [ ] Complete the sequence once, refresh, then retry confirmation and retrieval; stock stays 8 and invoice stays $225.
- [ ] Confirm role boundaries: technician work confirmation, manager closeout/invoice approval.
- [ ] Test cancel, stale confirmation, and pending-ingestion recovery.
- [ ] Measure actual microphone response and wearable retrieval delay separately.
- [ ] Rehearse three times and keep a consented screen recording with source labels visible.
- [ ] Inspect the repository and recording for credentials, private source links, real personal data, and browser notifications.

The implementation must provide a local-only **Reset synthetic demo** action or script. Resetting sample records must not revoke the real connection, delete other jobs, or become a public destructive endpoint.

## Recovery order

| Problem | Recovery | Disclosure |
| --- | --- | --- |
| New wearable recording not yet retrievable | Use a previously retrieved, consented source from that hardware | “Earlier wearable recording” with real captured/retrieved times |
| Wearable account or integration unavailable | Switch to the real live microphone path | “Live microphone”; wearable gate remains incomplete |
| Microphone blocked or too noisy | Replay the prepared synthetic audio clip through transcription if available | “Recorded demo audio” |
| AI/transcription network failure | Load the matching synthetic transcript/proposal fixture through the same deterministic business services | “Recorded demo”; inference unavailable |
| Database or venue connectivity failure | Use the local fixture adapter, or play the consented rehearsal recording | “Local fixture replay” or “Recorded rehearsal”; no live-service claim |

Do not simulate a success toast for a failed provider call. The fallback must be selectable and labeled before it changes records. Never silently mix synthetic labor with an actual customer's job.

## Submission preparation

Draft description:

> Worvo turns a maintenance technician's spoken work update into evidence-backed job records, material usage, an invoice draft, and projected job economics. AI proposes the structure; authorized people approve it; deterministic services keep the records and arithmetic consistent. Our first scenario is a commercial plumbing repair. The broader vision is an operating system that coordinates physical work across people, AI agents, and eventually robots.

Add the **actual** integration mode, working repository/demo links, measured results, and known limitations after implementation. Do not claim full wearable integration if only the microphone or fixture path passed.

This is preparation material, not an event submission or a promise of acceptance. The present task covers documentation and its GitHub push.
