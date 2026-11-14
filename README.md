# WORVO

**Say it. Get it done.**

Worvo collects spoken descriptions of completed work and turns them into detailed, itemized invoices that the business owner can review and send to the customer.

A technician says what they did, how long it took, and which parts they used. Worvo organizes that voice data, applies confirmed prices, prepares the invoice, and sends the approved version to the selected recipient.

> The moment to demonstrate: describe the repair aloud, watch a detailed invoice appear, then approve and send it.

**Repository status:** planning foundation only. The application, integrations, and automated tests have not been implemented.

## Start here

| Document | Purpose |
| --- | --- |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Canonical scope, architecture, invoice rules, API, and acceptance criteria |
| [Build tasks](docs/TASKS.md) | Dependency-ordered implementation tasks |
| [Agent instructions](AGENTS.md) | Repository rules for coding agents |
| [Agent kickoff prompt](docs/AGENT_PROMPT.md) | Copyable implementation instruction |
| [Demo runbook](docs/DEMO.md) | Voice-to-invoice scenario, exact numbers, and sending demonstration |
| [Sources and assumptions](docs/SOURCES.md) | Official references and unverified capabilities |

## The product loop

```mermaid
flowchart LR
    A[Collected work voice data] --> B[Extract work details]
    B --> C[Resolve missing details and prices]
    C --> D[Detailed invoice draft]
    D --> E[Review and approve]
    E --> F[Send to confirmed customer]
```

Each invoice line is traceable to captured speech or an explicit user correction. AI interprets the words; server-side code calculates totals. Sending uses the approved invoice and confirmed recipient.

## Hackathon focus

The worker's voice is the primary input. The screen shows the resulting invoice and evidence. Input modes remain visibly distinct: **Vexo memory**, **Live microphone**, and **Recorded demo**.

Worvo's focused connection to YC's Fall 2026 physical-world RFS is turning wearable work context into useful business output. The broader coordination thesis is context for the idea, not the MVP scope. See [the alignment](docs/IMPLEMENTATION_PLAN.md#2-yc-and-hackathon-fit) and [verified Vexo interface](docs/SOURCES.md#s3-vexo-developer-documentation).

The MVP covers capture, extraction, invoice review, and sending. Quoting, dispatch, scheduling, inventory management, and workforce coordination are outside it.

## Build approach

Keep the existing stack: Next.js, TypeScript, Tailwind, Zod, Supabase/PostgreSQL with Drizzle, Supabase Auth, Vercel AI SDK with OpenAI initially, and ElevenLabs transcription if accessible. Use pnpm. Add one invoice-email adapter and printable/PDF invoice output; select and verify the delivery provider during setup.

Begin with [T00](docs/TASKS.md#t00--check-hardware-and-provider-access), then follow the [kickoff prompt](docs/AGENT_PROMPT.md). The root [PLAN.md](PLAN.md) points to the same specification. [.env.example](.env.example) contains future configuration placeholders; application commands will be added when implemented.
