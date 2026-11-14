# WORVO — Implementation Plan

> **Say it. Get it done.**
> An AI operating system for physical work. A spoken work update becomes verified operational and financial data.

Built for **VexoHacks** (the AI wearables hackathon by Vexo at Y Combinator, San Francisco), Saturday Nov 14, 2026.
**Submission deadline: 6:00 PM Pacific today.** Every decision in this document is made to fit that deadline.

This is the source of truth for every human and coding agent on the project. Read it before you write code. If the code and this plan disagree, fix one of them in the same commit.

---

## 0. TL;DR for agents

1. **What we're building:** a field-service OS. A customer request is turned into a job, the AI quotes it, the job is dispatched to a technician, the technician *speaks* their work (Vexo bracelet or phone mic), and Worvo produces a work log, inventory changes, a draft invoice and profitability numbers. Every fact is traceable to voice evidence.
2. **The one moment to nail:** a real spoken update ("Replaced two valves, 90 minutes, leak fixed") becomes confirmed labor and material rows, then a correct invoice, then a correct gross margin. Nothing else matters if this moment fails.
3. **Golden rule:** the **LLM proposes** and **deterministic code decides**. Money, inventory and job state are computed server-side in plain TypeScript and never taken from model output.
4. **Humans approve anything financial.** AI output is always a draft until someone clicks Confirm.
5. **Build order:** business engine, then AI, then voice, then Vexo, then polish. Do not start with the wearable.
6. **Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Postgres (Supabase) via Drizzle · Zod · Vercel AI SDK (OpenAI default, Gemini swappable) · ElevenLabs (speech-to-text + text-to-speech) · Vexo MCP (OAuth 2.1 + PKCE) · Vitest + Playwright.

---

## 1. Why this wins

### Hackathon fit: "AI through wearables, voice and real-world experiences, not another app on a screen"
- The **technician never has to touch a screen.** They talk while they work (Vexo bracelet or phone). Worvo talks back with an ElevenLabs voice confirmation ("Logged 90 minutes and two half-inch valves on job 104. Say *confirm* or tap to edit.").
- The screen (the dashboard) is for the **office**, which consumes the data the voice produced.
- Real hardware moment: the presenter wears the Vexo bracelet while describing a repair, then Worvo pulls that conversation from Vexo memory and turns it into a costed job.

### YC RFS fit: operating systems for the physical world
- The blueprint targets YC's RFS on new operating systems for the physical world. As we understood it, that request covers AI that quotes and schedules jobs and coordinates humans (with wearables) and robots.
- *Verify before pitching:* confirm the exact RFS title and author on ycombinator.com/rfs (Fall 2026 tab). Related Winter 2027 RFS items we can also cite: **"The $15-an-Hour Expert"**, **"Robots Made in America"** and **"Wall Street for the Physical Buildout"**.
- **The thesis:** physical work is the last big category with no system of record that writes itself. Worvo makes the worker's voice the input device. The same work-assignment interface later dispatches robots (P2), so Worvo becomes the OS that coordinates **AI agents + humans + robots**.

### Sponsor fit (use real integrations, not logos)
| Sponsor | How Worvo uses it | Priority |
|---|---|---|
| **Vexo** | MCP memory retrieval of the technician's recorded work conversation (evidence plus citations) | P0 for the demo, P1 for robustness |
| **OpenAI** | Structured extraction (intake, quote scope, work log, closeout) via Zod-validated structured outputs | P0 |
| **ElevenLabs** | Speech-to-text (Scribe) for the live mic; text-to-speech for spoken confirmations back to the technician | P0 STT, P1 TTS |
| **Google DeepMind** | Gemini as a drop-in provider behind the same AI interface (`AI_PROVIDER=google`) | P1 |
| **Stripe** | Approved invoice becomes a Stripe **draft** invoice in test mode. Never finalized or charged automatically. | P1 |
| **Mastra** | Optional: wrap the orchestrator and the four functions as Mastra agent/tools once the plain-function version works | P2 |
| **Brex** | Roadmap: materials spend and technician cards reconcile against job costs | P2 (pitch only) |

---

## 2. Product

### The loop
```
Customer request ──► AI Operations Orchestrator ──► Human technician (+ Vexo) ──► AI back office
 problem, location     scope → quote → dispatch       speaks work updates,          work log → materials →
 customer details      → schedule                      hands-free                    invoice → profitability
```
**Worvo coordinates the work itself, not just the paperwork afterward.**

### Two voice inputs, one backend
Vexo's documented developer surface is a **read-only, pull-based MCP server** over stored conversation memory. It has no real-time audio stream, no webhooks and no way to push audio to the bracelet. So:

- **Vexo memory mode:** after the work is done, Worvo queries Vexo memory for the job's conversation and turns it into *candidate* job events with timestamps and citations.
- **Live voice mode:** phone or browser mic, then ElevenLabs STT, then the same extraction pipeline. This gives immediate feedback (and a spoken TTS confirmation).

Both produce the same `WorkLogProposal` and go through the same confirm step. **Never claim real-time Vexo streaming in the demo or the UI.**

### Scope
**P0: must work in the demo (build first)**
Job intake · AI quote · technician assignment · voice to work log · materials/inventory · draft invoice · profitability · end-to-end dashboard · seeded demo + one-click reset.

**P1: differentiation (only after P0 is green end-to-end)**
Real Vexo OAuth + sync · Work Evidence view with transcript citations · ElevenLabs TTS confirmations · Stripe draft invoice · Gemini provider switch · safety-claim warnings · quote-vs-actual variance alerts.

**P2: startup roadmap (pitch only, do not build today)**
Robot dispatch via a common work-assignment interface · workforce optimization · predictive maintenance · accounting sync (QuickBooks/Xero) · procurement · payment collection · multi-tenant permissions · Brex spend reconciliation.

### Definition of success
A judge watches **one repair request become a completed, costed job with a draft invoice and traceable voice evidence**, without anyone typing in the work details.

---

## 3. Architecture

One Next.js app. No microservices, no queues, no Kubernetes.

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | Next.js App Router, React, Tailwind, shadcn/ui, Lucide | Dashboard, job board, job detail, technician console |
| Backend | Next.js Route Handlers (`src/app/api/**/route.ts`) | Validation, state machine, business services |
| DB | Postgres on Supabase, accessed with **Drizzle ORM** (`DATABASE_URL`) | Jobs, money, inventory, evidence |
| Validation | Zod (shared between API and UI) | API inputs and AI outputs |
| AI | Vercel AI SDK `generateObject` + Zod schemas; provider set by env | Intake, quote scope, dispatch rationale, work log, closeout |
| Speech | `MediaRecorder` in the browser → `POST /api/voice/transcribe` → ElevenLabs STT; TTS via ElevenLabs | Live voice mode |
| Wearable | Vexo MCP client (`@modelcontextprotocol/sdk`) + OAuth 2.1 PKCE, server-side only | Memory mode |
| Tests | Vitest (services) + Playwright (golden-path E2E) | Acceptance tests in §10 |

**Provider-agnostic AI:** all model calls go through `src/lib/ai/client.ts`, which exports `extract<T>(schema, system, input)`. Swap providers with `AI_PROVIDER` / `AI_MODEL`. No provider SDK is imported anywhere else.

**Offline/demo safety:** `DEMO_MODE=true` makes AI and STT fall back to recorded fixtures in `src/lib/demo/fixtures/` when a provider errors or times out (>8s). The UI shows a small "fixture" badge, so we never misrepresent what happened.

### Repository layout
```
src/
  app/
    page.tsx                       # Operations dashboard
    jobs/page.tsx                  # Job command center (board)
    jobs/[id]/page.tsx             # Job detail: quote, tech, timeline, materials, invoice, evidence
    technician/page.tsx            # Mobile voice console
    api/
      jobs/route.ts                            # POST create, GET list
      jobs/[id]/route.ts                       # GET job + timeline
      jobs/[id]/quote/route.ts                 # POST draft quote
      jobs/[id]/approve-quote/route.ts
      jobs/[id]/assign/route.ts
      jobs/[id]/start/route.ts
      jobs/[id]/worklog/route.ts               # POST propose events (text or transcript)
      jobs/[id]/confirm-worklog/route.ts       # POST apply confirmed events (idempotent)
      jobs/[id]/complete/route.ts
      jobs/[id]/invoice/route.ts               # POST draft, PATCH approve
      voice/transcribe/route.ts                # audio → text (ElevenLabs)
      voice/speak/route.ts                     # text → audio (ElevenLabs TTS)
      vexo/oauth/start/route.ts
      vexo/oauth/callback/route.ts
      vexo/sync/route.ts
      dashboard/route.ts
      demo/reset/route.ts
  components/{dashboard,jobs,voice,evidence,ui}/
  lib/
    ai/            client.ts, prompts.ts, intake.ts, quote.ts, dispatch.ts, worklog.ts, closeout.ts
    vexo/          oauth.ts, client.ts, sync.ts
    voice/         stt.ts, tts.ts
    services/      jobs.ts (state machine), quoting.ts, dispatch.ts, worklog.ts, inventory.ts, invoicing.ts, metrics.ts
    db/            schema.ts, index.ts, seed.ts
    schemas/       index.ts   # ALL shared Zod contracts (see §7)
    money.ts       # cents helpers + formatting
    demo/fixtures/
drizzle/           # migrations
tests/unit/  tests/e2e/
.env.example
```

---

## 4. Data model

Every table has `id` (uuid, default `gen_random_uuid()`), `org_id` (uuid, a single seeded org today) and `created_at timestamptz default now()`.

| Table | Fields |
|---|---|
| `customers` | name, phone, email, address |
| `workers` | name, skills `text[]`, hourly_cost_cents, hourly_bill_rate_cents, work_start `time`, work_end `time` |
| `jobs` | number `int` (human id, e.g. 104), customer_id, title, description, category, urgency (`low\|normal\|high\|emergency`), required_skills `text[]`, status, assigned_worker_id, scheduled_start, scheduled_end, est_labor_minutes, actual_labor_minutes |
| `job_events` | job_id, type (`created\|quoted\|quote_approved\|assigned\|started\|work_logged\|material_used\|completed\|invoiced\|note`), payload `jsonb`, source (`system\|user\|live_voice\|vexo`), **source_key `text unique`**, actor |
| `materials` | sku, name, aliases `text[]`, unit, quantity_on_hand `int`, unit_cost_cents, billable_price_cents, tracked `bool` |
| `job_materials` | job_id, material_id, quantity, unit_cost_snapshot_cents, billable_price_snapshot_cents, event_id |
| `quotes` | job_id, version `int`, line_items `jsonb`, subtotal_cents, fees_cents, tax_cents, total_cents, status (`draft\|approved\|superseded`) |
| `invoices` | job_id, number (`INV-2026-0001`), line_items `jsonb`, subtotal_cents, tax_cents, total_cents, status (`draft\|approved\|void`), stripe_invoice_id |
| `evidence` | job_id, event_id, source_type (`live_voice\|vexo`), source_id, excerpt, spoken_at, citation (Vexo source id or recording id) |
| `audit_logs` | actor, action, entity, entity_id, before `jsonb`, after `jsonb` |
| `vexo_connections` | encrypted access/refresh tokens, expires_at, status. **Server-only.** |
| `settings` | default_labor_rate_cents, call_out_fee_cents, tax_rate_bps (nullable means no tax applied) |

### Business rules (non-negotiable)
- **Money is integer cents everywhere.** Format only at render time (`lib/money.ts`). No floats and no `toFixed` math.
- **State machine** (enforced in `services/jobs.ts`, rejected with 409 otherwise):
  `new → quoted → scheduled → in_progress → review → completed → invoiced` (+ `cancelled` from any pre-`completed` state). `review` means work was logged and a completion was claimed, and it waits for supervisor confirmation.
- **Estimated vs actual** labor and materials are stored separately. Variance is computed, never overwritten.
- **Never fabricate** prices, quantities, durations or taxes. Unknown means `null` plus a visible "needs input" chip.
- **Idempotency:** every applied event has a `source_key`. For live voice it is `live:{recordingId}:{index}`; for Vexo it is `vexo:{sourceId}:{index}`. Insert uses `ON CONFLICT DO NOTHING`. Re-syncing never double-charges or double-deducts.
- **Transactions:** confirm-worklog (events + job_materials + inventory + evidence), complete, and invoice creation each run in one DB transaction.
- **Snapshots:** job_materials and invoices snapshot prices at the time of use, so later catalog edits don't rewrite history.
- **Audit:** every mutation writes an `audit_logs` row.

### Seed data (`lib/db/seed.ts`, also run by `POST /api/demo/reset`)
- Org: "Bayline Plumbing & Electric" (fictional).
- Workers: **Maya Chen** (plumbing, gas; 8–16), **Diego Ramos** (electrical, HVAC; 9–17), **Sam Okafor** (plumbing, general; 10–18). Diego has an existing booking this afternoon, so dispatch has a real conflict to avoid.
- Materials: ½" ball valve, ¾" ball valve, P-trap kit, PTFE tape, supply line 16", wax ring, 15A breaker. Each has aliases (e.g. "valve", "shutoff", "half-inch valve").
- Customer: "Corner Cup Cafe", 560 20th St, San Francisco.
- Existing jobs in mixed statuses so the board and dashboard aren't empty. **Job #104 is created live during the demo** (reset sets the job sequence so the next job is 104).
- Settings: labor $95/h bill rate, $49 call-out fee, tax null by default (labor tax rules vary by state, so we don't invent them).

---

## 5. Workflow: step by step, with done-criteria

**Step 1: Intelligent intake.** "New Job" form: customer + free-text problem.
*"The cafe's sink is leaking under the counter. Two valves may need replacing."*
`ai/intake.ts` extracts `{title, category, urgency, requiredSkills, missingDetails[]}`. The job is stored as `new`.
✅ Creating a job shows it on the board immediately with its AI-extracted chips.

**Step 2: AI quote.** `ai/quote.ts` proposes the scope, `estLaborMinutes` and parts as `{materialQuery, quantity}`. `services/quoting.ts` resolves parts to the catalog and computes:
`total = round(estLaborMinutes/60 × laborRate) + Σ(qty × billablePrice) + callOutFee (+ tax if configured)`.
An unresolvable part becomes a line with `unitPriceCents: null` and the quote cannot be approved until a human fills it in.
✅ The user sees an itemized quote, can edit the lines and approve it. Approval writes an immutable quote version and moves the job to `quoted` → approved.

**Step 3: Dispatch.** `services/dispatch.ts` filters workers by skills, working hours and calendar overlap, then ranks them (fewest bookings today first, then earliest availability). `ai/dispatch.ts` only writes a **one-sentence rationale** for the top pick. It never chooses on its own.
✅ Approving the assignment sets `scheduled`, the job appears in that technician's queue, and a conflicting assignment returns 409.

**Step 4: Live voice work capture.** `/technician`: mobile-first, huge mic button, active job card. The technician presses Start Job (`in_progress`) and then speaks:
*"Worvo, job 104. Replaced two half-inch valves, worked about ninety minutes. Leak is fixed."*
Audio goes to STT, then `ai/worklog.ts`, then a `WorkLogProposal`. The UI shows the extracted fields, low-confidence or ambiguous fields highlighted, and a follow-up question for anything missing. P1: ElevenLabs reads back the summary.
✅ One utterance produces a structured, timestamped proposal with no manual field entry.

**Step 5: Vexo memory sync** (see §6). "Sync from Vexo" on the job pulls the matching conversation and produces the same `WorkLogProposal` with `source: "vexo"` and citations.
✅ A real authorized Vexo source creates a proposal, and the UI clearly labels it **Vexo memory** vs **Live mic**. If nothing is found yet, the UI says so honestly and offers Live voice.

**Step 6: Confirm, then apply.** `confirm-worklog` validates the state, resolves material names to the catalog (an uncertain match needs a pick), and in one transaction inserts events, job_materials (with snapshots), inventory deductions (if tracked) and evidence rows. If `completionClaim` is true, the job moves to `review`.
✅ Timeline and inventory reflect the work **exactly once**, even after a refresh, a double-click or a repeated sync.

**Step 7: Complete and invoice.** Supervisor approves completion (`completed`). `services/invoicing.ts` builds an invoice from *actual* labor × bill rate + used materials × snapshot billable price + fees (+ tax if configured), and shows a **quote vs actual variance** table. Approve sets the invoice to `approved` and the job to `invoiced`. P1: create a **Stripe draft invoice** (test mode) and store `stripe_invoice_id`. Never finalize or send automatically.
✅ Invoice total equals the sum of its line items, a human approved it, and nothing was charged.

**Step 8: Profitability.** `services/metrics.ts`, for each job and in aggregate:
`revenue = invoice total (approved; else the quote as projected)` · `direct cost = actual minutes/60 × worker hourly_cost + Σ qty × unit_cost_snapshot` · `gross profit = revenue − direct cost` · `gross margin % = gross profit / revenue × 100` (shown as "—" when revenue is 0).
Label it "invoiced (not collected)". We don't track payments today.
✅ The dashboard and the job page show identical numbers, because both come from `metrics.ts`.

---

## 6. Vexo integration (verified against vexoai.com/docs, last updated Oct 25, 2026)

- **MCP endpoint:** `https://api.vexoai.com/mcp` (Streamable HTTP, stateless JSON-RPC POST).
- **Auth:** OAuth 2.1 authorization code + **PKCE S256**, public client (`token_endpoint_auth_method: none`). **Dynamic client registration** at `https://api.vexoai.com/oauth/register` (RFC 7591). Discovery: `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server`. Endpoints: `/oauth/authorize`, `/oauth/token`, `/oauth/revoke`. Validate the `iss` param on callback (RFC 9207). Scope **`vexo:read`**. Access token lasts 1h, refresh token lasts 90d.
- **Rate limit:** 120 req/min/account. Errors are 401/403/429; results may be `partial: true`, which we surface in the UI.
- **Tools (read-only):**
  | Tool | Args | Use in Worvo |
  |---|---|---|
  | `get_context` | `query` (2–1000), `timezone?`, `fromDay?`, `toDay?` | **First call**: `"job 104 Corner Cup Cafe sink valves repair"`, scoped to today |
  | `search_transcripts` | `query`, `fromDay?`, `toDay?`, `limit? (≤50)` | Find exact utterances for citations |
  | `get_transcript` | `day` (YYYY-MM-DD), `cursor?` | Pull full context around a hit |
  | `list_transcript_days` | `fromDay?`, `toDay?`, `limit?` | Connection health check / "nothing recorded today" state |
  | `search` / `fetch` | `query` / `id` | Generic retrieval; `fetch` resolves a source id or `metadata.nextId` |
  Always call `tools/list` at connect time and validate the live schemas. The examples in the docs are illustrative.
- **Sync algorithm (`lib/vexo/sync.ts`):** refresh the token if needed → `get_context` → `search_transcripts` for job-specific terms → collect the excerpts with their source ids and timestamps → `ai/worklog.ts` with `source: "vexo"` → `WorkLogProposal` whose `evidence[]` carries `{sourceId, excerpt, spokenAt}`. Source keys derive from `sourceId`, so a re-sync is a no-op.
- **Security:** tokens are stored encrypted (`TOKEN_ENCRYPTION_KEY`, AES-256-GCM) in `vexo_connections`, are used only in route handlers and are never sent to the browser. A "Disconnect" button calls `/oauth/revoke`.
- **Honest states:** `not_connected` · `connected` · `syncing` · `nothing_found` · `partial` · `rate_limited` · `revoked`. Each has a visible UI state and a recovery action.
- **Demo prep:** record the consented Vexo conversation about job 104 **early (by 3 PM)** so memory has time to process. Test the sync at least once before demo time.

---

## 7. Contracts (agree on these first; they live in `src/lib/schemas/index.ts`)

```ts
import { z } from "zod";

export const Cents = z.number().int();            // can be negative for adjustments
export const JobStatus = z.enum(["new","quoted","scheduled","in_progress","review","completed","invoiced","cancelled"]);
export const EventSource = z.enum(["system","user","live_voice","vexo"]);

export const IntakeExtraction = z.object({
  title: z.string(),
  category: z.enum(["plumbing","electrical","hvac","general"]),
  urgency: z.enum(["low","normal","high","emergency"]),
  requiredSkills: z.array(z.string()),
  missingDetails: z.array(z.string()),
});

export const QuoteScopeProposal = z.object({
  scopeSummary: z.string(),
  estLaborMinutes: z.number().int().positive().nullable(),
  parts: z.array(z.object({ materialQuery: z.string(), quantity: z.number().int().positive().nullable() })),
  assumptions: z.array(z.string()),
  questions: z.array(z.string()),
});

export const QuoteLine = z.object({
  kind: z.enum(["labor","material","fee","tax"]),
  description: z.string(),
  quantity: z.number(),                     // minutes for labor, units for material
  unitPriceCents: Cents.nullable(),         // null = needs human input; blocks approval
  totalCents: Cents.nullable(),
  materialId: z.string().uuid().optional(),
});

export const WorkLogExtraction = z.object({  // what the LLM returns
  jobNumber: z.number().int().nullable(),
  actions: z.array(z.string()),
  laborMinutes: z.number().int().nonnegative().nullable(),
  materials: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().positive().nullable(),
    reportedTotalCostCents: Cents.nullable(), // informational only; never billed from this
  })),
  completionClaim: z.boolean(),
  safetyFlags: z.array(z.string()),
  ambiguities: z.array(z.string()),
  confidence: z.number().min(0).max(1),      // model-estimated, NOT calibrated
});

export const WorkLogProposal = z.object({   // what the API returns to the UI
  proposalId: z.string(),
  jobId: z.string().uuid(),
  source: z.enum(["live_voice","vexo"]),
  transcript: z.string(),
  extraction: WorkLogExtraction,
  resolvedMaterials: z.array(z.object({
    spokenName: z.string(),
    candidates: z.array(z.object({ materialId: z.string().uuid(), name: z.string(), score: z.number() })),
    selectedMaterialId: z.string().uuid().nullable(),   // null = needs human pick
    quantity: z.number().int().positive().nullable(),
  })),
  evidence: z.array(z.object({ sourceId: z.string(), excerpt: z.string(), spokenAt: z.string().datetime().nullable() })),
  followUpQuestions: z.array(z.string()),
});

export const ConfirmWorkLogInput = z.object({
  proposalId: z.string(),
  source: z.enum(["live_voice","vexo"]),
  sourceId: z.string(),                       // recordingId or Vexo sourceId → idempotency
  laborMinutes: z.number().int().nonnegative(),
  materials: z.array(z.object({ materialId: z.string().uuid(), quantity: z.number().int().positive() })),
  actions: z.array(z.string()),
  markComplete: z.boolean(),
  evidence: WorkLogProposal.shape.evidence,
});
```

### API
All responses use the shape `{ data } | { error: { code, message } }`. Every mutation validates its body with Zod **and** checks the current job state (409 on an illegal transition).

| Method & path | Body → Response | Transition |
|---|---|---|
| `POST /api/jobs` | `{customer, description}` → Job + IntakeExtraction | → `new` |
| `GET /api/jobs` · `GET /api/jobs/:id` | → jobs · job + timeline + quote + invoice + evidence + metrics | — |
| `POST /api/jobs/:id/quote` | → draft Quote | stays `new` |
| `POST /api/jobs/:id/approve-quote` | `{quoteId, lines?}` → approved Quote | `new → quoted` |
| `GET /api/jobs/:id/dispatch` | → ranked candidates + rationale | — |
| `POST /api/jobs/:id/assign` | `{workerId, start, end}` → Job | `quoted → scheduled` |
| `POST /api/jobs/:id/start` | → Job | `scheduled → in_progress` |
| `POST /api/voice/transcribe` | multipart audio → `{recordingId, transcript}` | — |
| `POST /api/jobs/:id/worklog` | `{source, sourceId, transcript}` → WorkLogProposal | — |
| `POST /api/jobs/:id/confirm-worklog` | ConfirmWorkLogInput → Job + new events | `in_progress → review` if `markComplete` |
| `POST /api/jobs/:id/complete` | → Job | `review → completed` |
| `POST /api/jobs/:id/invoice` · `PATCH …/invoice` | → draft · `{approve:true}` → approved | `completed → invoiced` on approve |
| `POST /api/vexo/sync` | `{jobId}` → WorkLogProposal \| `{status:"nothing_found"}` | — |
| `GET /api/dashboard` | → aggregated metrics | — |
| `POST /api/demo/reset` | → reseeded DB (only when `DEMO_MODE=true`) | — |

---

## 8. AI design

**One orchestrator plus four functions. Not a multi-agent framework.** Each function is a single `generateObject` call with a Zod schema.

| Function | Input | Output | It may NOT |
|---|---|---|---|
| `intake` | customer + free text | `IntakeExtraction` | invent addresses, prices |
| `quote` | job + material catalog names + settings | `QuoteScopeProposal` | output any dollar amounts |
| `dispatch` | top candidate + reasons from rules engine | one-sentence rationale | pick a worker |
| `worklog` | transcript/excerpts + job context + catalog names | `WorkLogExtraction` | fill unknowns, compute totals |
| `closeout` | approved events + invoice | customer-facing work summary (≤80 words) | change numbers |

The **orchestrator** (`ai/orchestrator.ts`, P1) maps a free-form utterance ("Worvo, I'm starting job 104" / "log 90 minutes") to one of the permitted actions (`start_job`, `propose_worklog`, `ask_status`). It only ever *calls our API services*, so the state machine and validation still apply.

**System prompt rules (shared in `ai/prompts.ts`):**
- Use only the information provided. Unknown means `null`. Do not guess quantities, prices, durations or taxes.
- Put anything unclear in `ambiguities`. Put anything safety-related (gas, live electrical, structural, water near electrical) in `safetyFlags`.
- Never compute totals or prices.
- `confidence` is a self-estimate. The UI labels it as such and **never** auto-applies based on it.

---

## 9. Build plan for today

Clock times assume we start at ~12:45 PM. Shift them if needed, but **keep the freezes.**

| Time | Phase | Exit criteria |
|---|---|---|
| 12:45–1:30 | **P1 Foundation:** Next.js + Tailwind + shadcn, Drizzle schema + migration, seed, `schemas/index.ts`, app shell + nav, job board reading real data | Board shows seeded jobs from Postgres |
| 1:30–2:30 | **P2 Business engine:** state machine, quoting, dispatch, worklog apply (idempotent), inventory, invoicing, metrics + **Vitest** for each | Unit tests green for acceptance tests 1, 2, 3, 5, 6 at the service level |
| 2:30–3:15 | **P3 AI:** `ai/client.ts` + intake, quote, worklog, closeout, dispatch rationale; fixtures for `DEMO_MODE` | Text in, valid Zod object out; fixtures used on failure |
| 3:15–4:00 | **P4 Voice:** technician console, recording, ElevenLabs STT, proposal preview, follow-ups, confirm | Spoken sentence produces confirmed events on the timeline |
| — by 3:00 | **Record the Vexo demo conversation** (human task) | Conversation exists in Vexo memory |
| 4:00–4:45 | **P5 Vexo:** OAuth PKCE + DCR, MCP client, sync, evidence citations, status states | "Sync from Vexo" produces a cited proposal |
| 4:45–5:30 | **P6 Polish:** dashboard, Work Evidence tab, TTS readback, Stripe draft (if time), mobile layout, error states, demo reset, Playwright golden path, deploy (Vercel) | Full 90-second demo runs twice in a row from reset |
| **5:30** | **Feature freeze.** Only demo fixes after this. | |
| 5:30–6:00 | Record the backup demo video, write the submission, submit | **Submitted before 6:00 PM** |

**Cut order if behind schedule** (cut from the top first): Stripe → Gemini switch → orchestrator → TTS → Playwright (keep the unit tests) → live Vexo OAuth (keep live voice; show the Vexo fixture *labeled as a fixture*). **Never cut:** voice → confirmed events → invoice → margin.

### Two-agent split
Work on separate branches and merge to `main` at each phase exit. **Contracts first:** `src/lib/schemas/index.ts` + `lib/db/schema.ts` land on `main` before any parallel work begins.

- **Backend agent (Codex):** `lib/db/**`, `drizzle/**`, `lib/services/**`, `lib/ai/**`, `lib/vexo/**`, `lib/voice/**`, `app/api/**`, `tests/unit/**`. Branch `be/*`.
- **Frontend agent (Claude Code):** `app/**/page.tsx`, `components/**`, layout and styling, client hooks, `tests/e2e/**`. Branch `fe/*`. Until an endpoint exists, use typed mocks that return the Zod contract shapes (`lib/mocks.ts`), and delete them once the endpoint lands.
- **Shared files** (`schemas/index.ts`, `money.ts`, `.env.example`, this plan): edit in small, separate commits announced in the commit message (`contract: …`). Never reformat someone else's file.

---

## 10. Interface

Polished SaaS, not hackathon forms. **Industrial-clean:** warm off-white (`#FAFAF7`) / charcoal (`#1C1C1A`), one restrained green accent (`#2F7D4F`), amber for "needs input", red only for errors and safety. Tabular numbers for money. Status colors are consistent everywhere.

- **A. Operations dashboard (`/`):** hero line "Say it. Get it done. Work spoken in the field becomes jobs, invoices and margin." KPI row (invoiced revenue, gross margin %, active jobs, technician utilization), alerts (needs input, safety flags, quote variance), **recent wearable activity** feed (Vexo/live voice events).
- **B. Job command center (`/jobs`):** columns by status, cards with job #, customer, tech avatar, urgency and source badges. "New Job" dialog.
- **C. Job detail (`/jobs/[id]`):** tabs for Overview · Quote · Schedule · Timeline · Materials · Invoice · **Work Evidence**. The Evidence tab is the differentiator: for each event it shows *what was said* (excerpt + time + source badge **Vexo memory** / **Live mic**) → *what AI extracted* → *what the human approved* → *what it cost*.
- **D. Technician console (`/technician`):** mobile-first, one giant mic button, active job card, recording state, proposal card with Confirm / Edit, follow-up question chips, source badge. Thumb-reachable, large type, works in one hand.
- Every async action needs a loading, empty, error and retry state. No raw stack traces in the UI.

---

## 11. Acceptance tests (must pass before the demo)

1. A new customer request creates **exactly one** job and one draft quote.
2. Quoting uses configured rates; an unknown price stays `null` and blocks approval.
3. Assigning a technician never creates an overlapping booking (409 on conflict).
4. The demo utterance produces `laborMinutes: 90`, materials `[{½" ball valve, 2}]` and `completionClaim: true`.
5. Repeating the same confirm or Vexo sync **does not** duplicate events, job_materials or inventory deductions.
6. Approved invoice total = Σ approved line items, and dashboard margin = job-page margin (same `metrics.ts`).

Failure states that must be recoverable and visible: Vexo not connected, token revoked or expired, nothing found, rate-limited, STT failure, AI timeout (fixture fallback in `DEMO_MODE`), illegal transition.

**Privacy and safety:** record only consented demo conversations; never continuously record customers; keep raw transcripts out of server logs; encrypt OAuth tokens; restrict evidence to authorized users; safety-flagged work requires explicit supervisor confirmation before completion. Don't deploy publicly with real data and without auth.

---

## 12. The 90-second demo

Before the demo, reset (`/api/demo/reset`) and have **two tabs** open: the dashboard on the laptop and `/technician` on a phone. The bracelet is on.

| t | Beat | On screen | Say |
|---|---|---|---|
| 0–10s | Hook | Dashboard | "Millions of trades jobs a day are still tracked on clipboards and memory. Workers can't type with their hands full. With Worvo, they just talk." |
| 10–25s | Intake + quote | New Job: "Corner Cup Cafe, sink leaking, two valves may need replacing" | "AI scopes it. Our pricing engine, not the LLM, computes the quote." Approve. |
| 25–35s | Dispatch | Maya recommended; Diego skipped because of a conflict | "Rules pick the tech; AI explains why." Assign → Start. |
| 35–55s | **Wearable moment** | Phone console | Speak the update (or "Sync from Vexo" to pull the conversation recorded on the bracelet earlier). Show the source badge and citations. |
| 55–70s | Confirm | Proposal card; tap Confirm | Timeline, inventory (½" valves 12 → 10) and labor update. TTS readback if it's built. |
| 70–85s | Invoice + margin | Invoice with quote-vs-actual; approve; dashboard margin ticks up | "Voice to verified invoice. Every line traces to what was said." |
| 85–90s | Vision | Evidence tab | "Today humans. Tomorrow robots take jobs through the same interface. Worvo is the operating system for physical work." |

Be honest about Vexo: "Vexo records the conversation; Worvo retrieves it from memory after the fact." **Backups:** a pre-recorded audio clip for the live mic, `DEMO_MODE` fixtures, and a screen-recorded run of the full demo.

---

## 13. The bigger vision (for the pitch and the judges)

- **Today:** AI agents + human technicians. Voice in, structured ops + finance out.
- **Next:** a **common work-assignment interface** (`Assignee = Human | Robot | Agent`) with capabilities, safety zones, required approvals and performance metrics. Robots receive jobs from the same dispatch engine.
- **Moat:** a growing, evidence-linked dataset of real physical work (what was done, how long it took, what it used and what it cost). That feeds better quoting, scheduling and, eventually, training data for physical AI.
- **Wedge:** small trades businesses (plumbing, electrical, HVAC) where the owner is the dispatcher, estimator and bookkeeper. Then expand to facilities, property management and field robotics fleets.

> **The feature to absolutely nail:** a real spoken work update becomes verified operational data and an accurate financial outcome. That moment is what separates Worvo from ordinary field-service software.
