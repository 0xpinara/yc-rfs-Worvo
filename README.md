# WORVO

**Say it. Get it done.**

Worvo turns spoken updates from physical work into verified job records, material usage, invoice drafts, and job economics. Its long-term vision is an operating system that coordinates human workers, AI agents, and eventually robots.

The first product serves small commercial maintenance teams. The VexoHacks prototype follows one cafe repair from request and quote through technician dispatch, wearable evidence, and closeout.

> The moment to demonstrate: a technician describes the repair while keeping their hands on the work; Worvo prepares the operational and financial records, with evidence and explicit approval.

**Repository status:** planning foundation only. The application, integrations, and automated tests have not been implemented. Unchecked items in the task list are future work.

## Start here

| Document | Purpose |
| --- | --- |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Canonical product scope, architecture, business rules, API contract, and acceptance criteria |
| [Build tasks](docs/TASKS.md) | Dependency-ordered implementation tasks and delivery gates |
| [Agent instructions](AGENTS.md) | Repository rules for coding agents |
| [Agent kickoff prompt](docs/AGENT_PROMPT.md) | Copyable instruction for Codex, Claude Code, or another coding agent |
| [Demo runbook](docs/DEMO.md) | Exact scenario, expected numbers, rehearsal, and fallback procedure |
| [Sources and assumptions](docs/SOURCES.md) | Official references, verified facts, and open integration questions |

## The product loop

```mermaid
flowchart LR
    A[Customer request] --> B[AI scope and quote draft]
    B --> C[Approved technician assignment]
    C --> D[Physical work and spoken update]
    D --> E[Evidence-backed work proposal]
    E --> F[Human confirmation]
    F --> G[Job records and inventory]
    G --> H[Invoice draft and projected margin]
```

The AI interprets language. Server-side services enforce permissions, state transitions, inventory, and arithmetic. A captured conversation supplies evidence; it does not grant permission to change the business.

## Hackathon focus

Worvo targets **Voice**, with **Ambient** as a secondary fit. The worker experience is the centerpiece; the manager screen makes its effects visible. Track descriptions and the published event schedule are linked in [Sources](docs/SOURCES.md).

The plan deliberately follows YC's **Fall 2026** RFS, **“New Operating Systems for the Physical World” by Charlie Warren**. The connection is a product thesis, not an endorsement: start with one observable work loop and expand the coordination layer over time. See [the alignment and limits](docs/IMPLEMENTATION_PLAN.md#2-yc-and-hackathon-fit).

There are three visibly distinct input modes:

- **Vexo memory:** permissioned recorded evidence, retrieved through the documented integration.
- **Live microphone:** immediate browser or phone recording and spoken feedback.
- **Recorded demo:** synthetic fixtures for rehearsal and recovery, always labeled.

The [source registry](docs/SOURCES.md#s3-vexo-developer-documentation) records the supported Vexo interface. A genuine wearable demonstration requires a successful hardware check; wearing a bracelet while using a browser microphone does not establish that connection.

## Build approach

Use one TypeScript application: Next.js, React, Tailwind, Zod, Supabase/PostgreSQL with Drizzle, Vercel AI SDK with OpenAI initially, and ElevenLabs transcription if account access is available. Use pnpm and commit its lockfile. Confirm current stable package compatibility during scaffolding; version numbers and model names are intentionally not guessed in this plan.

Begin with [T00: capability check](docs/TASKS.md#t00--check-hardware-and-provider-access), then build the smallest complete workflow. An agent implementing the app should add working setup commands, environment-variable documentation, and deployment instructions here as those become real.

For now, use the [kickoff prompt](docs/AGENT_PROMPT.md). The root [PLAN.md](PLAN.md) is an entry point to the same canonical specification. The existing [.env.example](.env.example) contains configuration placeholders for the future implementation; there are no application commands to run yet.
