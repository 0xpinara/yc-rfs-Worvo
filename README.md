# WORVO

**Say it. Send the invoice.**

Worvo helps a solo plumber create and send a customer invoice by speaking to a wearable. Customers and rates are configured once. During a visit, the plumber describes the work and requests an invoice; Worvo extracts the details, checks them, and uses Stripe Invoicing to prepare the invoice and customer payment page.

**Status:** local development foundation ready: Next.js shell, shared Zod contracts, synthetic invoice fixtures, and four contract tests. Authentication, persistence, voice capture, extraction, and Stripe are not implemented.

## First draft

One plumber, one business, known customers, USD, and one voice-to-invoice workflow. Technician signup, verification, matching, dispatch, inventory, and manager approvals are outside this draft.

The target is no computer interaction during invoicing. Initial setup can use a phone/browser. Whether creation and sending can both be authorized entirely from the band depends on its actual command interface. Retrieved recordings alone do not establish current authorization to send an invoice.

The result is a detailed invoice with professional work descriptions, labor/part quantities and rates, totals, and configured terms. Evidence and corrections stay traceable internally. Stripe supplies the customer document and delivery flow; uncertain sends must be reconciled before edits or retries.

The Vexo Open kit exposes a microphone, motion sensor, and colour light, with no assumed speaker. Band 53 has connected over Bluetooth and streamed motion on the development laptop. Audio, lights, phone integration, and authenticated band-only authorization remain unverified. Review and exceptions use a companion phone UI.

## Stripe and AI

- **Stripe Invoicing:** customer-specific draft, line items, finalization, email send request, hosted payment page, PDF, and payment status.
- **Gemini:** structured extraction from the plumber's words; OpenAI is an alternative.
- **Deepgram:** transcription when raw audio is accessible. Skip it when Vexo supplies usable text.
- **ElevenLabs or MiniMax:** optional companion-device readback after the core workflow works.
- **Brex:** deferred; expense reconciliation is outside this draft.

Start with one plumber's own Stripe sandbox account. Multi-business onboarding and account routing require a later Stripe Connect design even if Worvo never becomes a marketplace.

## Start here

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Hackathon scope: the one demo path, lanes, and the rules worth keeping |
| [Three-person execution plan](docs/PARALLEL_WORK_PLAN.md) | Parallel owners, file boundaries, shared contracts, checkpoints, and integration tests |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Canonical scope, voice authorization boundary, Stripe flow, and acceptance checks |
| [Tasks](docs/TASKS.md) | Dependency-ordered build |
| [Demo](docs/DEMO.md) | Canonical utterance and expected invoice |
| [Sources](docs/SOURCES.md) | Official references and unverified capabilities |
| [Agent prompt](docs/AGENT_PROMPT.md) | Implementation kickoff |

For the hackathon: one Next.js/TypeScript app with pnpm, Zod, one extraction model and Stripe test mode. No login or database; see [AGENTS.md](AGENTS.md). The other documents above describe the post-hackathon version.

## Local foundation

Use Node 24 (see `.nvmrc`) and pnpm 10.30.3. From this repository:

```powershell
rtk pnpm install --frozen-lockfile
rtk pnpm check
rtk pnpm build
rtk pnpm dev
```

Open `http://localhost:3000`. The shell requires no credentials and has no invoice actions. It binds to this computer only. `pnpm check` runs TypeScript, ESLint, and four contract tests; it does not prove arithmetic, authorization, database isolation, or provider behavior. `pnpm build` builds the production shell.

The shared types live in `src/shared/contracts.ts`; `src/fixtures/invoice.ts` is the canonical $225 synthetic review fixture. Its `.invalid` recipient cannot be used for sending. See [the execution plan](docs/PARALLEL_WORK_PLAN.md) before branching.

When integrations need configuration, enter only your authorized credentials privately into ignored `.env.local`, using [.env.example](.env.example) as the variable inventory. There is no runtime provider validator yet. Never commit keys or paste them into chat. No accounts, migrations, live invoices, or deployments were created by the foundation setup.

## Invoices and Stripe (lane B)

The server prices every draft from `src/server/invoices/catalog.ts` and keeps invoices in memory; Stripe test mode holds the real invoice.

| Route | Does |
| --- | --- |
| `POST /api/invoices/draft` | `{ transcript, source, sourceId? }` → `{ invoice }`. Runs the extractor, prices it, lists anything unclear in `unresolved`. Same `sourceId` returns the same draft. |
| `GET /api/invoices/:id` | Poll for `sendStatus`, `paymentStatus` and `hostedInvoiceUrl` (show it as a QR code). |
| `POST /api/invoices/:id/send` | `{ expectedRevision }`. Call on the double-tap. Creates, checks, finalizes and sends one Stripe invoice; a second call returns the same one. Refuses drafts with `unresolved` items. |
| `POST /api/stripe/webhook` | Signed Stripe events. `invoice.paid` sets `paymentStatus: "paid"`. |

### Stripe setup on the demo laptop

No Stripe account is needed: the CLI creates a test sandbox (it expires after 7 days). Run these in a terminal (PowerShell on Windows), in order.

1. Install the Stripe CLI. On Windows with Scoop: `scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git`, then `scoop install stripe` (without Scoop, download the Windows zip from https://github.com/stripe/stripe-cli/releases). On a Mac: `brew install stripe/stripe-cli/stripe`.
2. Create the sandbox: `stripe sandboxes create --email <your email>`. Put the `secret_key` it prints (it starts with `rkcs_test_`) in `.env.local` as `STRIPE_SECRET_KEY`.
3. Start webhook forwarding and leave that terminal open: `stripe listen --forward-to 127.0.0.1:3000/api/stripe/webhook`. Put the `whsec_...` it prints in `.env.local` as `STRIPE_WEBHOOK_SECRET`.
4. Add `INVOICE_TEST_RECIPIENT=billing@juniper-cafe.example.com` to `.env.local`. Stripe test mode never sends invoice emails, so nothing is ever sent to this address; `example.com` is a reserved domain, and it keeps our own addresses off the hosted invoice page shown on screen and in the demo video.
5. Start (or restart) `pnpm dev`. It reads `.env.local` only when it starts.

### Try the flow without the band

PowerShell:

```powershell
$draft = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/api/invoices/draft -ContentType 'application/json' -Body (@{ transcript = "Worvo, invoice Juniper Cafe for today's sink repair. Ninety minutes of labor at my usual rate and two shutoff valves at the standard price. Send it to their saved billing email."; source = "typed_text" } | ConvertTo-Json)
$sent = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3000/api/invoices/$($draft.data.invoice.id)/send" -ContentType 'application/json' -Body '{"expectedRevision":1}'
$sent.data.invoice.hostedInvoiceUrl
```

Mac or Linux:

```bash
curl -s -X POST 127.0.0.1:3000/api/invoices/draft -H 'content-type: application/json' -d '{"transcript":"Worvo, invoice Juniper Cafe for today'"'"'s sink repair. Ninety minutes of labor at my usual rate and two shutoff valves at the standard price. Send it to their saved billing email.","source":"typed_text"}'
curl -s -X POST 127.0.0.1:3000/api/invoices/<id>/send -H 'content-type: application/json' -d '{"expectedRevision":1}'
```

Open the `hostedInvoiceUrl`, pay with card `4242 4242 4242 4242` (any future date, any CVC), and within a few seconds `GET /api/invoices/<id>` shows `"paymentStatus":"paid"` (the `stripe listen` terminal shows `invoice.paid`).

## Companion screen (lane C)

`src/app/page.tsx` renders `InvoiceScreen`: what the plumber said, the priced invoice, then the QR code and PAID. It has a typed-transcript box as the fallback input and a Send button as the fallback for the double-tap.

The band code drives the same flow through `useInvoiceFlow()` in `src/components/invoices/useInvoiceFlow.ts`. Render the band component inside `InvoiceScreen` and pass it the `flow` object:

- When a band capture finishes: `flow.draftFromTranscript(text, "vexo_ble", sourceId)`.
- On the double-tap: `flow.send()`. It does nothing unless the invoice is priced with no open questions, and a second tap never sends twice.
- Light colours: amber while `flow.phase === "draft"`, green when `flow.phase === "paid"`.
