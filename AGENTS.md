# AGENTS.md — operating rules for coding agents (Codex, Claude Code, others)

**Read [PLAN.md](PLAN.md) first.** It is the source of truth for scope, schema, contracts, build order and the demo.
Hard deadline: **submission by 6:00 PM PT, Nov 14, 2026. Feature freeze at 5:30 PM.**

## Mission in one line
A technician's spoken work update (Vexo bracelet memory or live mic) becomes confirmed labor and materials, then a correct invoice, then a correct margin, with every number traceable to what was said.

## Non-negotiables
1. **The LLM proposes; code decides.** Never take money, totals, inventory or job status from model output. All of it is computed in `src/lib/services/**`.
2. **Integer cents only.** Use `src/lib/money.ts` for formatting. No floats for money.
3. **Unknown means `null`.** Never fabricate prices, quantities, durations or taxes. Show a "needs input" state instead.
4. **Human confirmation** before any financial or inventory change. AI output is always a draft.
5. **Idempotent and transactional** confirm-worklog, complete and invoice operations, keyed by `source_key`. Re-sync must be a no-op.
6. **State machine:** `new → quoted → scheduled → in_progress → review → completed → invoiced` (+ `cancelled`). Illegal transitions return 409.
7. **Vexo honesty:** Vexo is read-only, pull-based MCP memory. Never claim or imply real-time bracelet streaming.
8. **Secrets stay server-side.** No API keys or OAuth tokens in client components. Vexo tokens are encrypted at rest.
9. **No new infrastructure.** One Next.js app plus Postgres. No queues, microservices or extra frameworks unless PLAN.md lists them.
10. **Never fake success.** If a provider fails, show the error or a clearly labeled `DEMO_MODE` fixture.

## Build order (don't skip ahead)
Foundation → business engine with unit tests → AI functions → live voice → Vexo → polish. The wearable comes **after** the business loop works end-to-end.
If behind schedule, cut in this order: Stripe → Gemini → orchestrator → TTS → Playwright → live Vexo OAuth. **Never cut:** voice → confirmed events → invoice → margin.

## Ownership (to avoid merge conflicts)
| Area | Owner | Branch prefix |
|---|---|---|
| `src/lib/{db,services,ai,vexo,voice}/**`, `src/app/api/**`, `drizzle/**`, `tests/unit/**` | Backend agent (Codex) | `be/` |
| `src/app/**/page.tsx`, `src/app/layout.tsx`, `src/components/**`, `tests/e2e/**`, styling | Frontend agent (Claude Code) | `fe/` |
| `src/lib/schemas/index.ts`, `src/lib/money.ts`, `.env.example`, `PLAN.md`, `AGENTS.md` | Shared: small commits prefixed `contract:` | — |

- Contracts (`schemas/index.ts`, `db/schema.ts`) land on `main` **before** parallel work starts.
- The frontend mocks unfinished endpoints with typed data matching the Zod contracts (`src/lib/mocks.ts`) and deletes the mocks once the endpoint lands.
- Don't edit files you don't own except through a `contract:` commit. Don't reformat others' files.
- Merge to `main` at each phase exit in PLAN.md §9. Rebase, don't merge `main` into feature branches.

## Commands (keep these working)
```bash
pnpm install
pnpm dev              # http://localhost:3000
pnpm db:migrate       # drizzle-kit migrate
pnpm db:seed          # seed demo org (also POST /api/demo/reset when DEMO_MODE=true)
pnpm test             # vitest unit tests
pnpm test:e2e         # playwright golden path
pnpm lint && pnpm typecheck
```
Before every commit: `pnpm typecheck && pnpm test` must pass. Never commit `.env*` (only `.env.example`).

## Definition of done for any task
- Matches the contract in PLAN.md §7 (or updates the contract in a `contract:` commit).
- Has loading, empty, error and retry states (UI) or Zod validation + state checks + an audit log row (API).
- Has a unit test if it touches money, inventory, state or idempotency.
- Works from a fresh `POST /api/demo/reset`.

## AI function rules (apply to every prompt in `src/lib/ai/prompts.ts`)
Use only the provided input · return `null` for unknowns · list unclear items in `ambiguities` · list gas, electrical, structural and water-near-electrical risks in `safetyFlags` · never output prices or totals · `confidence` is self-estimated and never used to auto-apply anything.

---

## Master prompt (paste into a fresh Codex / Claude Code session)

```
You are building WORVO, an AI operating system for physical work, for the VexoHacks
hackathon (deadline 6:00 PM PT today). Read PLAN.md and AGENTS.md in this repo fully
before writing code. They are the source of truth.

Your role: <BACKEND agent | FRONTEND agent>. Only edit files you own per AGENTS.md.
Work on a branch prefixed <be/ | fe/>. Use the Zod contracts in src/lib/schemas/index.ts
exactly. If a contract must change, make a separate commit prefixed "contract:".

Current phase: <1 Foundation | 2 Business engine | 3 AI | 4 Voice | 5 Vexo | 6 Polish>.
Deliver that phase's exit criteria from PLAN.md §9 and nothing beyond it.

Hard rules: the LLM proposes and code decides; integer cents; null for unknowns;
human confirmation before financial/inventory changes; idempotent transactional
writes keyed by source_key; enforce the job state machine; Vexo is read-only memory
retrieval (never claim real-time streaming); secrets server-side only; no extra
infrastructure; never fake success.

Work in small, verifiable steps. After each step run `pnpm typecheck && pnpm test`.
Finish by reporting: what you built, which acceptance tests (PLAN.md §11) now pass,
what is mocked or stubbed, and the next step.
```
