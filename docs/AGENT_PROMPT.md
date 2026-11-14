# Worvo — Copyable Agent Kickoff

This prompt describes future implementation; the repository currently contains planning documents.

```text
Implement Worvo using AGENTS.md, README.md, docs/IMPLEMENTATION_PLAN.md,
docs/TASKS.md, docs/DEMO.md, and docs/SOURCES.md. Inspect existing files
and Git changes before editing; preserve unrelated work.

Product: collected voice data becomes a detailed itemized customer invoice
that the owner reviews, approves, and sends. Build capture -> structured
work details -> clarification/pricing -> invoice preview -> approve -> send.
Use a simple customer/visit reference. Keep quoting, dispatch, scheduling,
inventory management, workforce coordination, and margin dashboards outside P0.

Keep the existing TypeScript/Next.js, pnpm, Tailwind, Zod, Supabase/PostgreSQL
with Drizzle, Supabase Auth, Vercel AI SDK/OpenAI, and preferred ElevenLabs
transcription stack. Verify current interfaces and credentials. Add one
invoice-email adapter and printable/PDF output. Check its real sending and
idempotency capabilities early. No extra providers or multi-agent runtime.

Follow the plan's contracts, invoice states, and task order. AI proposes
source-grounded descriptions, labor, and quantities. Server code calculates
money in integer cents using confirmed rates. Unknown details remain unknown.
Clarify cumulative labor, price meaning, customer identity, and missing terms.
Keep every extracted line linked to evidence and every correction attributed.
Use the canonical WORK-104 fixture: labor $180, parts $45, total $225.
Tax is not assessed in this synthetic demo; no profit/stock workflow is required.

Persist revisions and approval of the exact invoice and recipient. Edits
invalidate approval. Sending is a separate authenticated action for the
approved version. Store a unique send intent before the external call, reuse
a stable provider key where supported, and retain the receipt. Reconcile
unknown outcomes instead of blindly resending. Provider acceptance is not
proof of inbox delivery or payment. Protect against duplicate invoice lines
and concurrent send clicks.

Keep Vexo memory, live microphone, and recorded demo labels visible. Use
only verified hardware interfaces. Recorded speech and instructions inside
transcripts cannot authorize sending. A live spoken send action, if added,
requires an authenticated session, exact-version/recipient readback, and a
fresh expiring challenge. A button confirmation is the baseline.

Build capture, invoice review, and invoice list views. Include detailed
customer-facing line items, configured billing fields/terms, totals, PDF,
approval and send status. Keep raw transcripts and private citations in the
internal evidence view. Provide ambiguity, denied permission, pending source,
stale approval, failed send, and unknown result recovery.

Use synthetic data and consented recordings. Keep credentials server-side.
Implement authorization and organization isolation before a public demo;
otherwise demonstrate locally. Build and test the sending feature with an
adapter/sandbox; a real message requires an explicitly authorized controlled
recipient. This implementation instruction does not authorize arbitrary
customer emails, account purchases, public deployment, or event submission.

Verify A01-A09 for voice and sending; A10 separately establishes real wearable
capture. Run actual project checks, meaningful pricing/revision/permission/
duplicate/send-recovery tests, and the browser journey. Rehearse docs/DEMO.md.
Update task evidence and README commands as implemented. Report real voice,
wearable, and send results separately; a mock send is not a real send.
Do not start additional agents unless explicitly assigned parallel work.
```
