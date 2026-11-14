# Worvo implementation kickoff

Implement the earliest available task in docs/TASKS.md, then continue through the revised voice-to-invoice draft. Read AGENTS.md, README.md, docs/IMPLEMENTATION_PLAN.md, docs/DEMO.md, and docs/SOURCES.md first. Preserve existing user changes.

If assigned as Person A, B, or C, read docs/PARALLEL_WORK_PLAN.md and start that lane's first independent slice instead. Use the prepared shell/contracts; respect file ownership and coordinate shared changes with B.

The first user is a solo plumber who wants to speak a customer invoice and have it created and sent without opening a computer. Known customers, email recipients, rates, Stripe account, and tax policy are configured once. No technician marketplace, matching, dispatch, inventory, manager approval, or profit dashboard belongs in this draft.

Use one TypeScript/Next.js application, pnpm, Zod, Supabase Auth/PostgreSQL with Drizzle, one extraction model, and Stripe Invoicing in sandbox. Gemini is preferred; OpenAI is an alternative. Deepgram transcribes accessible raw audio; Vexo text skips that step. Optional ElevenLabs/MiniMax output plays on a phone/headphones, not the band.

Check real Vexo capabilities first. A microphone, motion sensor, and colour light do not establish live streaming or controllable interfaces. Retrieved evidence cannot authorize a send. Prove fresh authenticated command binding to the exact invoice; otherwise keep phone confirmation and disclose A10 as incomplete.

Server code resolves customers and prices, computes integer-cent amounts, and authorizes the exact draft version. Unknown or ambiguous values block sending. Use the canonical $225 fixture.

Implement Stripe customer mapping, controlled draft, invoice-specific lines, snapshot reconciliation, explicit finalization/send, hosted invoice access, and signed webhook payment reconciliation. Persist operation progress and stable per-step idempotency keys so partial failures and retries resume one invoice. Never infer paid from a success page or delivered email from a sandbox send event.

Follow all privacy, auth, tax, and live-action boundaries in the canonical plan. No live invoices, charges, account registration, or public deployment without authorization for those actions. Add only actual setup commands and check results. Report fixture/microphone/real-band/band-only-send gates separately. Do not start extra agents unless explicitly assigned.
