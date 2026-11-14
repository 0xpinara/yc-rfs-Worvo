# Worvo

**Say it. Get it done.** An AI operating system for physical work.

A customer requests a repair. Worvo scopes and quotes it, dispatches the right technician, and captures the work by **voice**, either live from a phone or retrieved from the technician's **Vexo** bracelet memory. It then updates labor and inventory, drafts the invoice and computes the job's margin. Every number traces back to what was said.

Built at **VexoHacks** (AI wearables hackathon by Vexo at Y Combinator), Nov 14, 2026. Aimed at YC's request for **new operating systems for the physical world**: AI agents, humans with wearables and, eventually, robots, all coordinated in one system of record.

- 📐 Spec and build plan: [PLAN.md](PLAN.md)
- 🤖 Rules for coding agents: [AGENTS.md](AGENTS.md)

## Stack
Next.js · TypeScript · Tailwind + shadcn/ui · Postgres (Supabase) + Drizzle · Zod · Vercel AI SDK (OpenAI / Gemini) · ElevenLabs · Vexo MCP (OAuth 2.1 + PKCE) · Stripe (test-mode drafts) · Vitest + Playwright

## Quick start
```bash
cp .env.example .env.local   # fill in keys
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```
