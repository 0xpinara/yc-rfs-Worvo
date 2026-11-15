# Instructions for agents working on Worvo

This is a one-day hackathon demo (VexoHacks, Nov 14, submit by 6 PM Pacific). Build the one demo path below and nothing else. The longer docs in `docs/` (IMPLEMENTATION_PLAN, PARALLEL_WORK_PLAN, TASKS, AGENT_PROMPT, SOURCES) are the post-hackathon production plan: do not build their login, database, revisions, durable operations or acceptance matrix today.

## The demo path

1. Band 53 (Vexo Open kit, `Vexo-HACK-53`) streams live mic audio. The plumber says the Juniper Cafe line in `docs/DEMO.md`.
2. Deepgram turns it into text; Gemini 4 turns the text into a `Proposal` (`src/shared/contracts.ts`).
3. The server prices it from the saved catalog: $180 labor + $45 valves = $225.
4. Mic off, band light amber, and a read-back plays through the laptop or earbuds (ElevenLabs): "Juniper Cafe, $225. Double-tap to send."
5. A double-tap on the band calls `POST /api/invoices/:id/send`. Stripe creates, finalizes and sends the invoice, and the screen shows its hosted link as a QR code.
6. Someone pays on their phone with test card 4242 4242 4242 4242. Stripe's `invoice.paid` webhook marks it paid: the screen says PAID and the band light turns green.

## Rules worth keeping

- The AI only proposes fields (customer reference, labor minutes, item references and quantities). Server code resolves the customer and prices from the catalog and does all math in integer cents. Anything missing or ambiguous leaves the invoice a draft with `unresolved` filled in, and send refuses it.
- Nothing goes to Stripe without a fresh double-tap after the read-back (the companion page's Send button is the fallback). Words like "send it" in a transcript are not enough on their own.
- Only Stripe's signed `invoice.paid` webhook marks an invoice paid.
- Stripe test mode only; the code rejects live keys. Test mode never emails the customer, which is why the demo shows the hosted invoice link as a QR code.
- Secrets go in `.env.local` (git-ignored). Never commit, paste or log keys.

## Stack

- The existing Next.js app, pnpm with one lockfile, Zod contracts in `src/shared/contracts.ts`.
- No login, no Supabase, no Drizzle, no database. One plumber, Juniper Cafe and the rates live in `src/server/invoices/catalog.ts`; invoices live in server memory; Stripe holds the lasting record.
- Local only: `pnpm dev` on the demo laptop, and `stripe listen --forward-to 127.0.0.1:3000/api/stripe/webhook` for webhooks. No deployment.
- Band: the official kit's JS library (Web Bluetooth in Chrome or Edge). One Bluetooth program at a time. While the mic is on, the light is locked blue: stop audio before setting amber or green.

## Lanes

| Lane | Owns | Files |
| --- | --- | --- |
| A: band and voice | Band connection, live audio to Deepgram, Gemini extraction, double-tap, light colours, read-back | `src/server/capture`, `src/server/extraction`, `src/components/capture`, `src/app/api/captures` |
| B: invoices and Stripe | Pricing, in-memory invoice store, send, webhook; also `contracts.ts`, `package.json`, the lockfile, `.env.example` | `src/server/invoices`, `src/server/stripe`, `src/app/api/invoices`, `src/app/api/stripe` |
| C: companion screen | One page: listening, draft (lines and total), sent (QR code), paid; plus the Send button fallback | `src/app/page.tsx`, `src/components/invoices` |

## Working together

- Branch from `main`, open small PRs into `main`, and don't push straight to `main`. Run `pnpm check` before pushing.
- Test the code that moves money (pricing, sending once, the webhook), not every edge case.
- Timeline: first full run 3:30 PM; feature freeze and rehearsal on the real band 4:30; demo video 5:15; README and Devpost submitted 5:45.
